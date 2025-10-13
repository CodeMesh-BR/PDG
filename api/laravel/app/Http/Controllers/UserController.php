<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(
            \App\Models\User::query()
                ->select('id', 'display_name', 'full_name', 'email', 'role', 'created_at')
                ->orderByDesc('id')
                ->paginate(15)
        );
    }

    // PATCH/PUT /api/users/{user}
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'display_name' => ['sometimes', 'string', 'min:2', 'max:150'],
            'full_name'    => ['sometimes', 'string', 'min:3', 'max:150'],

            // troca de senha: exige confirmação
            'password' => [
                'sometimes',
                'string',
                'min:8',
                'max:16',
                'regex:/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/',
                'confirmed',
            ],

            // arrays
            'skills'          => ['sometimes', 'array'],
            'skills.*'        => ['string', Rule::in([
                'service-cleaning',
                'delivery-cleaning',
                'full-details',
                'paint-correction',
                'paint-protection',
                'buffers'
            ])],
            'availability'    => ['sometimes', 'array'],
            'availability.*'  => ['string', Rule::in(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])],

            // salvar URL já pronta
            'contract_pdf_path'         => ['sometimes', 'string', 'max:2048'],
            'work_certificate_pdf_path' => ['sometimes', 'string', 'max:2048'],

            // upload de PDF (multipart/form-data)
            'contract_pdf'         => ['sometimes', 'file', 'mimetypes:application/pdf', 'max:20480'],
            'work_certificate_pdf' => ['sometimes', 'file', 'mimetypes:application/pdf', 'max:20480'],

            // senha atual (checamos manualmente se password vier)
            'current_password' => ['nullable', 'string'],
        ], [
            'password.regex' => 'Password must be 8-16 characters long, with letters and numbers.',
        ]);

        // Uploads
        if ($request->hasFile('contract_pdf')) {
            $path = $request->file('contract_pdf')->store('contracts', 'public');
            $validated['contract_pdf_path'] = Storage::disk('public')->url($path);
        }
        if ($request->hasFile('work_certificate_pdf')) {
            $path = $request->file('work_certificate_pdf')->store('certificates', 'public');
            $validated['work_certificate_pdf_path'] = Storage::disk('public')->url($path);
        }

        // Troca de senha: exigir current_password e validar contra o próprio $user
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

        $user->fill($validated)->save();

        return response()->json([
            'message' => 'User updated successfully.',
            'data' => [
                'id'                        => $user->id,
                'display_name'              => $user->display_name,
                'full_name'                 => $user->full_name,
                'email'                     => $user->email,
                'role'                      => $user->role,
                'skills'                    => $user->skills,
                'availability'              => $user->availability,
                'contract_pdf_path'         => $user->contract_pdf_path,
                'work_certificate_pdf_path' => $user->work_certificate_pdf_path,
                'updated_at'                => $user->updated_at,
            ],
        ]);
    }

    // GET /api/users/{user}
    public function show(User $user)
    {
        return response()->json([
            'data' => [
                'id'                        => $user->id,
                'display_name'              => $user->display_name,
                'full_name'                 => $user->full_name,
                'email'                     => $user->email,
                'address'                   => $user->address,
                'phone'                     => $user->phone,
                'role'                      => $user->role,
                'skills'                    => $user->skills,
                'availability'              => $user->availability,
                'contract_pdf_path'         => $user->contract_pdf_path,
                'work_certificate_pdf_path' => $user->work_certificate_pdf_path,
                'updated_at'                => $user->updated_at,
                'created_at'                => $user->created_at,
            ],
        ]);
    }

    // DELETE /api/users/{user}
    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(null, 204);
    }
}
