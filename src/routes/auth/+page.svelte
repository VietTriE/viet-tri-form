<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';

	let authKey = '';
	let errorMessage = '';
	let isLoading = false;

	async function handleLogin() {
		isLoading = true;
		errorMessage = '';

		const res = await fetch(`https://viet_tri_api.mkt-viettri.workers.dev/api/auth/check`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `${authKey}`
			}
		});

		const resData = (await res.json()) as any;

		if (resData.ok) {
			// Replace with your expected key
			if (browser) {
				localStorage.setItem('authKey', resData.message);
				goto('/');
			}
		} else {
			errorMessage = 'Mật khẩu không chính xác';
		}
		isLoading = false;
	}
</script>

<div class="auth-container">
	<div class="auth-card">
		<h1 class="text-2xl font-bold text-blue-500">ĐĂNG NHẬP</h1>

		<form on:submit|preventDefault={handleLogin}>
			<div class="form-group">
				<label for="authKey">Nhập mật khẩu</label>
				<input
					type="password"
					id="authKey"
					bind:value={authKey}
					placeholder="Nhập mật khẩu..."
					disabled={isLoading}
					required
				/>
			</div>

			{#if errorMessage}
				<div class="error-message">
					{errorMessage}
				</div>
			{/if}

			<button type="submit" class="login-button" disabled={isLoading}>
				{isLoading ? 'Logging in...' : 'Login'}
			</button>
		</form>
	</div>
</div>

<style>
	.auth-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		background-color: #f5f7f9;
	}

	.auth-card {
		background-color: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		width: 100%;
		max-width: 400px;
	}

	h1 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		color: #333;
		text-align: center;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #333;
	}

	input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}

	input:focus {
		outline: none;
		border-color: #4299e1;
		box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
	}

	.login-button {
		width: 100%;
		padding: 0.75rem;
		background-color: #4299e1;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.login-button:hover:not(:disabled) {
		background-color: #3182ce;
	}

	.login-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.error-message {
		color: #e53e3e;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}
</style>
