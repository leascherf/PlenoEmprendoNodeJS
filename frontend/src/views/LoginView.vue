<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm text-center space-y-6">
      <h1 class="text-2xl font-bold text-gray-800">PlenoEmprendo</h1>
      <p class="text-gray-500 text-sm">Iniciá sesión con tu cuenta de Google para continuar.</p>
      <a
        href="/api/auth/google"
        class="flex items-center justify-center gap-3 w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
      >
        <svg class="w-5 h-5" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.08-6.08C34.5 3.04 29.53 1 24 1 14.82 1 7.08 6.48 3.64 14.27l7.07 5.49C12.53 13.44 17.8 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.22-.42-4.74H24v8.98h12.7c-.55 2.91-2.2 5.38-4.69 7.04l7.19 5.59C43.18 37.6 46.5 31.5 46.5 24.5z"/>
          <path fill="#FBBC05" d="M10.71 28.24A14.6 14.6 0 0 1 9.5 24c0-1.48.25-2.91.71-4.24l-7.07-5.49A23.94 23.94 0 0 0 .5 24c0 3.87.93 7.53 2.64 10.73l7.57-6.49z"/>
          <path fill="#34A853" d="M24 47c5.53 0 10.17-1.83 13.56-4.96l-7.19-5.59c-1.83 1.23-4.17 1.95-6.37 1.95-6.2 0-11.47-3.94-13.29-9.26l-7.57 6.49C7.08 41.52 14.82 47 24 47z"/>
        </svg>
        Iniciar sesión con Google
      </a>
    </div>
  </div>
</template>
