/**
 * Pending Actions Utility
 *
 * Provides a secure token-based system for email verification, password reset,
 * and email change flows. Replaces Firebase's action codes with custom tokens
 * stored in Firestore for full control over the verification process.
 *
 * Security features:
 * - Cryptographically secure 64-character tokens
 * - Only hashed tokens stored in Firestore (plain token sent in email)
 * - 1-hour expiry for all action types
 * - One-time use (token deleted after verification)
 * - User binding (token tied to user ID)
 */

import { createHash, randomBytes } from 'crypto';
import { adminDb } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// ============================================================================
// Types
// ============================================================================

/** Supported action types for pending verifications */
export type ActionType = 'emailVerification' | 'passwordReset' | 'emailChange' | 'recoverEmail';

/** Base structure for all pending actions */
interface BasePendingAction {
	type: ActionType;
	userId: string;
	tokenHash: string; // SHA-256 hash of the plain token
	expiresAt: Timestamp;
	createdAt: Timestamp;
}

/** Email verification action data */
interface EmailVerificationAction extends BasePendingAction {
	type: 'emailVerification';
	email: string;
}

/** Password reset action data */
interface PasswordResetAction extends BasePendingAction {
	type: 'passwordReset';
	email: string;
}

/** Email change action data */
interface EmailChangeAction extends BasePendingAction {
	type: 'emailChange';
	oldEmail: string;
	newEmail: string;
}

/** Email recovery action data (to revert an unwanted email change) */
interface RecoverEmailAction extends BasePendingAction {
	type: 'recoverEmail';
	oldEmail: string; // The email to recover/restore to
	newEmail: string; // The current (unwanted) email
}

/** Union type for all pending action types */
export type PendingAction =
	| EmailVerificationAction
	| PasswordResetAction
	| EmailChangeAction
	| RecoverEmailAction;

/** Data required when creating each action type */
export type CreateActionData =
	| { type: 'emailVerification'; email: string }
	| { type: 'passwordReset'; email: string }
	| { type: 'emailChange'; oldEmail: string; newEmail: string }
	| { type: 'recoverEmail'; oldEmail: string; newEmail: string };

/** Result returned when validating a pending action */
export interface ValidatedAction {
	actionId: string;
	userId: string;
	data: PendingAction;
}

// ============================================================================
// Constants
// ============================================================================

/** Firestore collection name for pending actions */
const COLLECTION_NAME = 'pendingActions';

/** Token expiry time in milliseconds (1 hour) */
const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

/** Recovery token expiry time in milliseconds (7 days - users need more time to notice unwanted changes) */
const RECOVERY_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/** Length of generated tokens (64 characters = 32 bytes in hex) */
const TOKEN_LENGTH_BYTES = 32;

// ============================================================================
// Token Utilities
// ============================================================================

/**
 * Generates a cryptographically secure random token
 * @returns 64-character hex string
 */
function generateToken(): string {
	return randomBytes(TOKEN_LENGTH_BYTES).toString('hex');
}

/**
 * Hashes a token using SHA-256 for secure storage
 * @param token - Plain text token to hash
 * @returns SHA-256 hash of the token
 */
function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Creates a new pending action and returns the plain token to be sent in email.
 *
 * The plain token is returned but only the hash is stored in Firestore.
 * This ensures that even database access cannot reveal valid tokens.
 *
 * @param userId - The Firebase user ID this action belongs to
 * @param actionData - Type-specific data for the action
 * @returns Plain token to include in verification link
 *
 * @example
 * const token = await createPendingAction('user123', {
 *   type: 'emailVerification',
 *   email: 'user@example.com'
 * });
 * const link = `${baseUrl}/verify-email?token=${token}`;
 */
export async function createPendingAction(
	userId: string,
	actionData: CreateActionData
): Promise<string> {
	// Generate secure token
	const plainToken = generateToken();
	const tokenHash = hashToken(plainToken);

	// Calculate expiry timestamp
	// Recovery tokens get a longer expiry (7 days) since users need time to notice unwanted changes
	const now = Timestamp.now();
	const expiryMs = actionData.type === 'recoverEmail' ? RECOVERY_TOKEN_EXPIRY_MS : TOKEN_EXPIRY_MS;
	const expiresAt = Timestamp.fromMillis(now.toMillis() + expiryMs);

	// Build the pending action document
	const pendingAction: PendingAction = {
		...actionData,
		userId,
		tokenHash,
		createdAt: now,
		expiresAt
	} as PendingAction;

	// Delete any existing pending actions of the same type for this user
	// This prevents accumulation of unused tokens
	await deleteExistingActions(userId, actionData.type);

	// Store in Firestore
	await adminDb.collection(COLLECTION_NAME).add(pendingAction);

	// Return plain token (only this is sent in email)
	return plainToken;
}

/**
 * Validates a token and returns the associated action data.
 *
 * Performs the following checks:
 * 1. Token hash exists in Firestore
 * 2. Action type matches expected type
 * 3. Token has not expired
 *
 * Does NOT delete the action - call deletePendingAction() after successful use.
 *
 * @param token - Plain token from the verification link
 * @param expectedType - The action type we expect this token to be for
 * @returns Validated action data including actionId for deletion
 * @throws Error if token is invalid, expired, or wrong type
 *
 * @example
 * try {
 *   const { actionId, userId, data } = await validatePendingAction(token, 'emailVerification');
 *   // Perform the action...
 *   await deletePendingAction(actionId);
 * } catch (error) {
 *   // Handle invalid/expired token
 * }
 */
export async function validatePendingAction(
	token: string,
	expectedType: ActionType
): Promise<ValidatedAction> {
	// Hash the provided token to compare with stored hash
	const tokenHash = hashToken(token);

	// Query Firestore for matching token hash
	const snapshot = await adminDb
		.collection(COLLECTION_NAME)
		.where('tokenHash', '==', tokenHash)
		.limit(1)
		.get();

	// Check if token exists
	if (snapshot.empty) {
		throw new Error('Invalid or expired verification link. Please request a new one.');
	}

	const doc = snapshot.docs[0];
	const data = doc.data() as PendingAction;

	// Verify action type matches
	if (data.type !== expectedType) {
		throw new Error('Invalid verification link. Please request a new one.');
	}

	// Check if token has expired
	const now = Timestamp.now();
	if (data.expiresAt.toMillis() < now.toMillis()) {
		// Clean up expired token
		await doc.ref.delete();
		throw new Error('This verification link has expired. Please request a new one.');
	}

	return {
		actionId: doc.id,
		userId: data.userId,
		data
	};
}

/**
 * Deletes a pending action after successful verification.
 *
 * Should be called after the action has been successfully processed
 * to ensure one-time use of tokens.
 *
 * @param actionId - The Firestore document ID to delete
 */
export async function deletePendingAction(actionId: string): Promise<void> {
	await adminDb.collection(COLLECTION_NAME).doc(actionId).delete();
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Deletes any existing pending actions of a specific type for a user.
 *
 * This prevents token accumulation when users request multiple
 * verification emails without using them.
 *
 * @param userId - The user ID to clean up actions for
 * @param type - The action type to delete
 */
async function deleteExistingActions(userId: string, type: ActionType): Promise<void> {
	const snapshot = await adminDb
		.collection(COLLECTION_NAME)
		.where('userId', '==', userId)
		.where('type', '==', type)
		.get();

	// Delete all matching documents
	const batch = adminDb.batch();
	snapshot.docs.forEach((doc) => {
		batch.delete(doc.ref);
	});
	await batch.commit();
}

/**
 * Cleanup utility: Deletes all expired pending actions.
 *
 * Can be called periodically (e.g., via a scheduled function)
 * to clean up expired tokens from the database.
 *
 * @returns Number of expired actions deleted
 */
export async function cleanupExpiredActions(): Promise<number> {
	const now = Timestamp.now();

	const snapshot = await adminDb
		.collection(COLLECTION_NAME)
		.where('expiresAt', '<', now)
		.get();

	if (snapshot.empty) {
		return 0;
	}

	const batch = adminDb.batch();
	snapshot.docs.forEach((doc) => {
		batch.delete(doc.ref);
	});
	await batch.commit();

	return snapshot.size;
}

