<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Validation\Validator;

class DepartmentController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => Department::query()
                ->select('id', 'name', 'description', 'bill_by_unit', 'bill_by_hour', 'bill_by_quantity', 'created_at', 'updated_at')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateDepartment($request);

        try {
            $department = Department::create($validated);

            return response()->json([
                'message' => 'Department created successfully.',
                'data' => $department,
            ], 201);
        } catch (QueryException $e) {
            if ($e->getCode() === '23505') {
                return response()->json(['message' => 'Duplicate entry.'], 409);
            }

            throw $e;
        }
    }

    public function show(Department $department)
    {
        return response()->json([
            'data' => $department,
        ]);
    }

    public function update(Request $request, Department $department)
    {
        $validated = $this->validateDepartment($request);

        try {
            $department->update($validated);

            return response()->json([
                'message' => 'Department updated successfully.',
                'data' => $department,
            ]);
        } catch (QueryException $e) {
            if ($e->getCode() === '23505') {
                return response()->json(['message' => 'Duplicate entry.'], 409);
            }

            throw $e;
        }
    }

    public function destroy(Department $department)
    {
        if ($department->services()->exists()) {
            return response()->json([
                'message' => 'Department is attached to one or more services.',
            ], 422);
        }

        $department->delete();

        return response()->json(null, 204);
    }

    private function validateDepartment(Request $request): array
    {
        $validator = validator($request->all(), [
            'name' => ['required', 'string', 'min:2', 'max:150'],
            'description' => ['nullable', 'string', 'max:500'],
            'bill_by_unit' => ['sometimes', 'boolean'],
            'bill_by_hour' => ['sometimes', 'boolean'],
            'bill_by_quantity' => ['sometimes', 'boolean'],
        ]);

        $validator->after(function (Validator $validator) use ($request) {
            if (
                !$request->boolean('bill_by_unit')
                && !$request->boolean('bill_by_hour')
                && !$request->boolean('bill_by_quantity')
            ) {
                $validator->errors()->add('billing', 'Select at least one billing mode.');
            }
        });

        return $validator->validate();
    }
}
