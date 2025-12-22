// Loops email service for transactional emails
import { LoopsClient, APIError } from 'loops';
import { env } from '$env/dynamic/private';

// App name for email templates
const APP_NAME = env.APP_NAME || 'Your App';

// Initialize Loops client lazily to handle missing env var during build
let loopsClient: LoopsClient | null = null;

function getLoopsClient(): LoopsClient {
	if (!loopsClient) {
		if (!env.LOOPS_API_KEY) {
			throw new Error('LOOPS_API_KEY environment variable is not set');
		}
		loopsClient = new LoopsClient(env.LOOPS_API_KEY);
	}
	return loopsClient;
}

// Transactional email template IDs from Loops dashboard
// Update these with your actual transactional IDs after creating templates
const TRANSACTIONAL_IDS = {
	EMAIL_VERIFICATION: 'cmjbkdswi00qs0i06lq5il4od',
	PASSWORD_RESET: 'cmjgy3rpu6brq0izd48l0nqk5',
	EMAIL_CHANGE: 'cmjgzkuji0cdm0ixuzcnr08x5',
	EMAIL_CHANGED_NOTIFICATION: 'cmjh0smww0jt10izg61lu2exo'
} as const;

/**
 * Helper to extract error message from Loops API error
 */
function getErrorMessage(error: APIError, fallback: string): string {
	const json = error.json as unknown as Record<string, unknown> | undefined;
	if (json && typeof json.message === 'string') {
		return json.message;
	}
	return fallback;
}

/**
 * Sends email verification link to a new user
 */
export async function sendVerificationEmail(
	email: string,
	firstName: string,
	verificationLink: string,
	baseUrl: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const loops = getLoopsClient();
		await loops.sendTransactionalEmail({
			transactionalId: TRANSACTIONAL_IDS.EMAIL_VERIFICATION,
			email,
			dataVariables: {
				appName: APP_NAME,
				firstName: firstName || 'there',
				verificationLink,
				baseUrl
			}
		});
		return { success: true };
	} catch (error) {
		if (error instanceof APIError) {
			console.error('Loops API error (verification):', error.json);
			return { success: false, error: getErrorMessage(error, 'Failed to send verification email') };
		}
		console.error('Error sending verification email:', error);
		return { success: false, error: 'Failed to send verification email' };
	}
}

/**
 * Sends password reset link to user
 */
export async function sendPasswordResetEmail(
	email: string,
	firstName: string,
	resetLink: string,
	baseUrl: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const loops = getLoopsClient();
		await loops.sendTransactionalEmail({
			transactionalId: TRANSACTIONAL_IDS.PASSWORD_RESET,
			email,
			dataVariables: {
				appName: APP_NAME,
				firstName: firstName || 'there',
				resetLink,
				baseUrl
			}
		});
		return { success: true };
	} catch (error) {
		if (error instanceof APIError) {
			console.error('Loops API error (password reset):', error.json);
			return { success: false, error: getErrorMessage(error, 'Failed to send password reset email') };
		}
		console.error('Error sending password reset email:', error);
		return { success: false, error: 'Failed to send password reset email' };
	}
}

/**
 * Sends email change verification link to user
 */
export async function sendEmailChangeVerificationEmail(
	email: string,
	firstName: string,
	verificationLink: string,
	newEmail: string,
	baseUrl: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const loops = getLoopsClient();
		await loops.sendTransactionalEmail({
			transactionalId: TRANSACTIONAL_IDS.EMAIL_CHANGE,
			email,
			dataVariables: {
				appName: APP_NAME,
				firstName: firstName || 'there',
				verificationLink,
				newEmail,
				baseUrl
			}
		});
		return { success: true };
	} catch (error) {
		if (error instanceof APIError) {
			console.error('Loops API error (email change):', error.json);
			return { success: false, error: getErrorMessage(error, 'Failed to send email change verification') };
		}
		console.error('Error sending email change verification:', error);
		return { success: false, error: 'Failed to send email change verification' };
	}
}

/**
 * Sends notification to old email address when email has been changed.
 * This is a security notification so the user knows their email was changed.
 * Includes a recovery link to revert the change if it was unauthorized.
 */
export async function sendEmailChangedNotification(
	oldEmail: string,
	firstName: string,
	newEmail: string,
	recoveryLink: string,
	baseUrl: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const loops = getLoopsClient();
		await loops.sendTransactionalEmail({
			transactionalId: TRANSACTIONAL_IDS.EMAIL_CHANGED_NOTIFICATION,
			email: oldEmail,
			dataVariables: {
				appName: APP_NAME,
				firstName: firstName || 'there',
				newEmail,
				recoveryLink,
				baseUrl
			}
		});
		return { success: true };
	} catch (error) {
		if (error instanceof APIError) {
			console.error('Loops API error (email changed notification):', error.json);
			return { success: false, error: getErrorMessage(error, 'Failed to send email changed notification') };
		}
		console.error('Error sending email changed notification:', error);
		return { success: false, error: 'Failed to send email changed notification' };
	}
}

export { TRANSACTIONAL_IDS };

