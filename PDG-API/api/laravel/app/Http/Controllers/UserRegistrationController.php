<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserRegistrationController extends Controller
{
    public function store(Request $request)
    {
        $request->merge([
            'full_name' => trim((string) $request->input('full_name')),
            'display_name' => trim((string) $request->input('display_name', $request->input('full_name'))),
            'email'     => strtolower(trim((string) $request->input('email'))),
            'role'      => trim((string) $request->input('role')),
        ]);

        $validated = $request->validate([
            'display_name' => ['required', 'string', 'min:2', 'max:150'],
            'full_name'    => ['required', 'string', 'min:3', 'max:150'],
            'address'      => ['nullable', 'string', 'max:255'],
            'phone'        => ['nullable', 'string', 'max:20', 'regex:/^\+?[0-9\s\-()]{7,20}$/'],
            'email'        => ['required', 'email:rfc', 'max:255', Rule::unique('users', 'email')],
            'password'     => ['required', 'string', 'min:8', 'max:16', 'regex:/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/'],
            'role'         => ['required', 'string', 'max:50'],

            'service_ids'   => ['sometimes', 'array'],
            'service_ids.*' => ['integer', 'exists:services,id'],

            'availability'   => ['sometimes', 'array'],
            'availability.*' => ['string', Rule::in(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])],
        ], [
            'phone.regex'    => 'Phone must contain only digits, space, +, -, ( ) and be 7–20 characters long.',
            'password.regex' => 'Password must be 8–16 characters and contain letters and numbers.',
            'email.unique'   => 'Email already exists.',
        ]);

        if (User::where('email', $validated['email'])->exists()) {
            return response()->json(['message' => 'Email already exists.'], 409);
        }

        try {
            $user = User::create([
                'display_name' => $validated['display_name'],
                'full_name'    => $validated['full_name'],
                'email'        => $validated['email'],
                'password'     => Hash::make($validated['password']),
                'role'         => $validated['role'],
                'address'      => $validated['address'] ?? null,
                'phone'        => $validated['phone'] ?? null,
                'availability' => $validated['availability'] ?? null,
            ]);

            if (!empty($validated['service_ids'])) {
                $user->services()->sync($validated['service_ids']);
            }
        } catch (QueryException $e) {
            // Postgres: 23505 = unique_violation
            if ((int)($e->errorInfo[0] ?? 0) === 23505 || $e->getCode() === '23505') {
                return response()->json(['message' => 'Email already exists.'], 409);
            }
            throw $e;
        }

        return response()->json([
            'message' => 'User created successfully',
            'data' => [
                'id'           => $user->id,
                'display_name' => $user->display_name,
                'full_name'    => $user->full_name,
                'email'        => $user->email,
                'role'         => $user->role,
                'created_at'   => $user->created_at,
                'services'     => $user->services()->get(['services.id', 'type']),
            ]
        ], 201);
    }
}
