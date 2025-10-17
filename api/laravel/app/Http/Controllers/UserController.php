<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    // GET /api/users
    public function index(Request $request)
    {
        $query = User::query()
            ->select('id', 'display_name', 'full_name', 'email', 'role', 'created_at')
            ->orderByDesc('id');

        if ($request->boolean('include_services')) {
            $query->with(['services:id,type']);
        }

        return response()->json($query->paginate(15));
    }

    // PATCH/PUT /api/users/{user}
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'display_name' => ['sometimes', 'string', 'min:2', 'max:150'],
            'full_name'    => ['sometimes', 'string', 'min:3', 'max:150'],

            'password' => ['sometimes', 'string', 'min:8', 'max:16', 'regex:/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/', 'confirmed'],
            'current_password' => ['nullable', 'string'],

            'availability'   => ['sometimes', 'array'],
            'availability.*' => ['string', Rule::in(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])],

            'contract_pdf_path'         => ['sometimes', 'string', 'max:2048'],
            'work_certificate_pdf_path' => ['sometimes', 'string', 'max:2048'],

            'contract_pdf'         => ['sometimes', 'file', 'mimetypes:application/pdf', 'max:20480'],
            'work_certificate_pdf' => ['sometimes', 'file', 'mimetypes:application/pdf', 'max:20480'],

            'service_ids'   => ['sometimes', 'array'],
            'service_ids.*' => ['integer', 'exists:services,id'],
        ], [
            'password.regex' => 'Password must be 8-16 characters long, with letters and numbers.',
        ]);

        if ($request->hasFile('contract_pdf')) {
            $path = $request->file('contract_pdf')->store('contracts', 'public');
            $validated['contract_pdf_path'] = Storage::disk('public')->url($path);
        }
        if ($request->hasFile('work_certificate_pdf')) {
            $path = $request->file('work_certificate_pdf')->store('certificates', 'public');
            $validated['work_certificate_pdf_path'] = Storage::disk('public')->url($path);
        }

        if ($request->filled('password')) {
            if (!$request->filled('current_password')) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors'  => ['current_password' => ['Current password is required.']],
                ], 422);
            }
            if (!Hash::check($request->input('current_password'), $user->password)) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors'  => ['current_password' => ['Current password is incorrect.']],
                ], 422);
            }
            $validated['password'] = Hash::make($validated['password']);
        }

        $toFill = collect($validated)->except('service_ids')->all();

        DB::transaction(function () use ($user, $toFill, $validated) {
            $user->fill($toFill)->save();

            if (array_key_exists('service_ids', $validated)) {
                $user->services()->sync($validated['service_ids'] ?? []);
            }
        });

        $user->loadMissing('services:id,type,value');

        return response()->json([
            'message' => 'User updated successfully.',
            'data' => [
                'id'                        => $user->id,
                'display_name'              => $user->display_name,
                'full_name'                 => $user->full_name,
                'email'                     => $user->email,
                'role'                      => $user->role,
                'availability'              => $user->availability,
                'contract_pdf_path'         => $user->contract_pdf_path,
                'work_certificate_pdf_path' => $user->work_certificate_pdf_path,
                'services'                  => $user->services->map->only(['id', 'type']),
                'updated_at'                => $user->updated_at,
            ],
        ]);
    }

    // GET /api/users/{user}
    public function show(User $user)
    {
        $user->loadMissing('services:id,type,value');

        return response()->json([
            'data' => [
                'id'                        => $user->id,
                'display_name'              => $user->display_name,
                'full_name'                 => $user->full_name,
                'email'                     => $user->email,
                'address'                   => $user->address,
                'phone'                     => $user->phone,
                'role'                      => $user->role,
                'availability'              => $user->availability,
                'contract_pdf_path'         => $user->contract_pdf_path,
                'work_certificate_pdf_path' => $user->work_certificate_pdf_path,
                'services'                  => $user->services->map->only(['id', 'type']),
                'updated_at'                => $user->updated_at,
                'created_at'                => $user->created_at,
            ],
        ]);
    }

    // DELETE /api/users/{user}
    public function destroy(User $user)
    {
        $user->delete();
        return response()->json([
            'message' => 'User deleted successfully.',
            'data'    => [
                'id'  => $user->id,
            ]
        ], 204);
    }
}
