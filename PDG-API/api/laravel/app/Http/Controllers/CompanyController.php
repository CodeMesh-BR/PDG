<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CompanyController extends Controller
{
    // GET /api/companies
    public function index()
    {
        $companies = \App\Models\Company::with(['services' => function ($q) {
            $q->select('services.id', 'type', 'description', 'value');
        }])
            ->select('id', 'name', 'display_name', 'email', 'address', 'phone', 'default_service_id', 'created_at')
            ->orderByDesc('id')
            ->paginate(15);

        return response()->json($companies);
    }

    // POST /api/companies
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'         => ['required', 'string', 'min:2', 'max:150'],
            'display_name' => ['nullable', 'string', 'max:50'],
            'email'        => ['required', 'email:rfc', 'max:255', 'unique:companies,email'],
            'address'      => ['nullable', 'string', 'max:255'],
            'phone'        => ['nullable', 'string', 'max:20', 'regex:/^\+?[0-9\s\-()]{7,20}$/'],
            'default_service_id' => ['required', 'integer', 'exists:services,id'],

            'service_ids'   => ['sometimes', 'array'],
            'service_ids.*' => ['integer', 'exists:services,id'],

        ], [
            'phone.regex' => 'Phone must contain only digits, space, +, -, ( ) and be 7–20 characters long.',
        ]);

        // 409 explícito para e-mail duplicado (além da validação)
        if (Company::where('email', strtolower($validated['email']))->exists()) {
            return response()->json(['message' => 'Email already exists.'], 409);
        }

        $validated['email'] = strtolower($validated['email']);
        $company = Company::create($validated);

        $serviceIds = $validated['service_ids'] ?? [];
        if (!in_array($validated['default_service_id'], $serviceIds, true)) {
            $serviceIds[] = $validated['default_service_id'];
        }
        $company->services()->sync($serviceIds);

        return response()->json([
            'message' => 'Company created successfully',
            'data' => $company->only([
                'id',
                'name',
                'display_name',
                'email',
                'address',
                'phone',
                'default_service_id',
                'services',
                'created_at'
            ]),
        ], 201);
    }

    // GET /api/companies/{id}
    public function show($id)
    {
        $company = Company::findOrFail($id);

        return response()->json([
            'data' => $company->only([
                'id',
                'name',
                'display_name',
                'email',
                'address',
                'phone',
                'default_service_id',
                'services',
                'created_at',
                'updated_at'
            ])
        ]);
    }

    // PUT/PATCH /api/companies/{id}
    public function update(Request $request, $id)
    {
        $company = Company::findOrFail($id);

        $validated = $request->validate([
            'name'         => ['sometimes', 'string', 'min:2', 'max:150'],
            'display_name' => ['sometimes', 'string', 'max:50'],
            'email'        => ['sometimes', 'email:rfc', 'max:255', Rule::unique('companies', 'email')->ignore($company->id)],
            'address'      => ['sometimes', 'string', 'max:255'],
            'phone'        => ['sometimes', 'string', 'max:20', 'regex:/^\+?[0-9\s\-()]{7,20}$/'],
            'default_service_id' => ['sometimes', 'integer', 'exists:services,id'],

            'service_ids'   => ['sometimes', 'array'],
            'service_ids.*' => ['integer', 'exists:services,id'],
        ]);

        if (array_key_exists('email', $validated)) {
            $validated['email'] = strtolower($validated['email']);
        }

        $company->fill($validated)->save();

        $serviceIds = null;
        if ($request->has('service_ids')) {
            $serviceIds = $validated['service_ids'] ?? [];
        }

        $effectiveDefaultServiceId = $company->default_service_id;
        if (array_key_exists('default_service_id', $validated)) {
            $effectiveDefaultServiceId = $validated['default_service_id'];
        }

        if ($serviceIds !== null) {
            if ($effectiveDefaultServiceId && !in_array($effectiveDefaultServiceId, $serviceIds, true)) {
                $serviceIds[] = $effectiveDefaultServiceId;
            }
            $company->services()->sync($serviceIds);
        } elseif (array_key_exists('default_service_id', $validated)) {
            $company->services()->syncWithoutDetaching([$effectiveDefaultServiceId]);
        }

        // retornar ja com os servicos atualizados
        $company->load('services:id,type,description,value', 'defaultService:id,type,description,value');

        return response()->json([
            'message' => 'Company updated successfully',
            'data' => $company
        ]);
    }

    // DELETE /api/companies/{id}
    public function destroy($id)
    {
        $company = Company::findOrFail($id);
        $company->delete();

        return response()->json(null, 204);
    }
}

