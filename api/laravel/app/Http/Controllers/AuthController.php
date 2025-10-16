<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    // POST /api/auth/login
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email:rfc', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'max:64'],
        ]);

        $user = User::where('email', strtolower($credentials['email']))->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials.'
            ], 401);
        }

        $expiresAt = now()->addHours(10);
        $token = $user->createToken('auth-token', ['*'], $expiresAt);

        return response()->json([
            'message'     => 'Login successful.',
            'token_type'  => 'Bearer',
            'access_token' => $token->plainTextToken,
            'expires_at'  => $expiresAt->toIso8601String(),
            'user'        => [
                'id'           => $user->id,
                'display_name' => $user->display_name,
                'full_name'    => $user->full_name,
                'email'        => $user->email,
                'role'         => $user->role,
            ],
        ]);
    }

    // POST /api/auth/logout
    public function logout(Request $request)
    {
        $current = $request->user()->currentAccessToken();
        if ($current) {
            $current->delete();
        }

        return response()->json(['message' => 'Logged out.']);
    }

    // POST /api/auth/logout-all
    // Revoga todos os tokens do usuário
    public function logoutAll(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'Logged out from all sessions.']);
    }

    // GET /api/auth/me
    public function me(Request $request)
    {
        $u = $request->user();
        return response()->json([
            'data' => [
                'id'           => $u->id,
                'display_name' => $u->display_name,
                'full_name'    => $u->full_name,
                'email'        => $u->email,
                'role'         => $u->role,
                'expires_at'   => optional($u->currentAccessToken())->expires_at,
            ]
        ]);
    }
}
