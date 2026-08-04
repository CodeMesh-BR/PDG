<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Department;
use App\Models\ServiceLog;
use App\Models\User;
use App\Traits\RestrictsCompanyAccess;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ServiceLogController extends Controller
{
    use RestrictsCompanyAccess;

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'company_id' => ['required', 'integer', 'exists:companies,id'],
            'service_id' => ['required', 'integer', 'exists:services,id'],
            'department_id' => ['sometimes', 'nullable', 'integer', 'exists:departments,id'],
            'vehicle_condition' => ['sometimes', 'nullable', Rule::in(['new', 'used'])],
            'stock_number' => ['sometimes', 'nullable', 'string', 'max:50'],
            'car_plate' => ['sometimes', 'nullable', 'string', 'max:20'],
            'date' => ['required', 'date_format:Y-m-d'],
            'quantity' => ['sometimes', 'integer', 'min:1'],
            'notes' => ['sometimes', 'string', 'max:1000'],
            'force' => ['sometimes', 'boolean'],
        ]);

        if (!$this->ensureCompanyAllowed($user, $validated['company_id'])) {
            return response()->json([
                'message' => 'You are not allowed to log services for this company.',
            ], 403);
        }

        $company = Company::with([
            'services:id,department_id',
            'services.department:id,name,description,bill_by_unit,bill_by_hour,bill_by_quantity',
        ])->findOrFail($validated['company_id']);

        $service = $company->services->firstWhere('id', $validated['service_id']);

        if (!$service) {
            return response()->json([
                'message' => 'This service is not attached to the selected company.',
            ], 422);
        }

        $effectiveDepartment = $service->department;

        if (!empty($validated['department_id'])) {
            $effectiveDepartment = Department::select([
                'id', 'name', 'description', 'bill_by_unit', 'bill_by_hour', 'bill_by_quantity',
            ])->find($validated['department_id']);
        }

        $isNewUsed = $effectiveDepartment?->name === 'New / Used';
        $carPlate = $this->normalizeNullableValue($validated['car_plate'] ?? null);
        $stockNumber = $this->normalizeNullableValue($validated['stock_number'] ?? null);
        $vehicleCondition = $validated['vehicle_condition'] ?? null;

        $validationMessage = $this->validateVehicleFields(
            $isNewUsed,
            $vehicleCondition,
            $stockNumber,
            $carPlate
        );

        if ($validationMessage) {
            return response()->json(['message' => $validationMessage], 422);
        }

        if (!$isNewUsed) {
            $vehicleCondition = null;
            $stockNumber = null;
        }

        $duplicateQuery = ServiceLog::where('company_id', $validated['company_id'])
            ->where('service_id', $validated['service_id'])
            ->whereDate('performed_at', $validated['date']);

        if ($isNewUsed) {
            $duplicateQuery
                ->where('vehicle_condition', $vehicleCondition)
                ->where('stock_number', $stockNumber);

            if ($vehicleCondition === 'used') {
                $duplicateQuery->where('car_plate', $carPlate);
            }
        } else {
            $duplicateQuery->where('car_plate', $carPlate);
        }

        if ($duplicateQuery->exists() && empty($validated['force'])) {
            return response()->json([
                'message' => 'A service entry for this car, service and date already exists.',
                'needs_confirmation' => true,
            ], 409);
        }

        $log = ServiceLog::create([
            'user_id' => $user->id,
            'company_id' => $validated['company_id'],
            'service_id' => $validated['service_id'],
            'department_id' => $effectiveDepartment?->id,
            'car_plate' => $carPlate,
            'vehicle_condition' => $vehicleCondition,
            'stock_number' => $stockNumber,
            'performed_at' => $validated['date'],
            'quantity' => $validated['quantity'] ?? 1,
            'notes' => $validated['notes'] ?? null,
        ]);

        $log->setRelation('department', $effectiveDepartment);

        return response()->json([
            'message' => 'Service entry created successfully.',
            'data' => $this->serializeLog($log),
        ], 201);
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $logs = ServiceLog::with($this->logRelations($user))

            ->when(
                !$user->canManageAllServiceLogs(),
                fn($q) => $q->where('user_id', $user->id)
            )
            ->when(
                $request->filled('user_id') && $user->canManageAllServiceLogs(),
                fn($q) => $q->where('user_id', $request->integer('user_id'))
            )
            ->when(
                $request->filled('company_id'),
                fn($q) => $q->where('company_id', $request->integer('company_id'))
            )
            ->when(
                $request->filled('date'),
                fn($q) => $q->whereDate('performed_at', $request->input('date'))
            )
            ->tap(fn($q) => $this->applyCompanyRestriction($q, $user, 'company_id'))
            ->orderByDesc('performed_at')
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json($logs);
    }

    public function show(Request $request, ServiceLog $serviceLog)
    {
        $user = $request->user();

        if (!$this->canManageLog($user, $serviceLog)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $serviceLog->load($this->logRelations($user));

        return response()->json(['data' => $serviceLog]);
    }

    public function update(Request $request, ServiceLog $serviceLog)
    {
        $user = $request->user();

        if (!$this->canManageLog($user, $serviceLog)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'company_id' => ['sometimes', 'integer', 'exists:companies,id'],
            'service_id' => ['sometimes', 'integer', 'exists:services,id'],
            'department_id' => ['sometimes', 'nullable', 'integer', 'exists:departments,id'],
            'vehicle_condition' => ['sometimes', 'nullable', Rule::in(['new', 'used'])],
            'stock_number' => ['sometimes', 'nullable', 'string', 'max:50'],
            'car_plate' => ['sometimes', 'nullable', 'string', 'max:20'],
            'date' => ['sometimes', 'date_format:Y-m-d'],
            'quantity' => ['sometimes', 'integer', 'min:1'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ]);

        $companyId = $validated['company_id'] ?? $serviceLog->company_id;
        $serviceId = $validated['service_id'] ?? $serviceLog->service_id;

        if (!$this->ensureCompanyAllowed($user, $companyId)) {
            return response()->json([
                'message' => 'You are not allowed to log services for this company.',
            ], 403);
        }

        $company = Company::with([
            'services:id,department_id',
            'services.department:id,name,description,bill_by_unit,bill_by_hour,bill_by_quantity',
        ])->findOrFail($companyId);

        $service = $company->services->firstWhere('id', $serviceId);

        if (!$service) {
            return response()->json([
                'message' => 'This service is not attached to the selected company.',
            ], 422);
        }

        $effectiveDepartment = $service->department;

        if (array_key_exists('department_id', $validated) && !empty($validated['department_id'])) {
            $effectiveDepartment = Department::select([
                'id', 'name', 'description', 'bill_by_unit', 'bill_by_hour', 'bill_by_quantity',
            ])->find($validated['department_id']);
        }

        $isNewUsed = $effectiveDepartment?->name === 'New / Used';
        $carPlate = $this->normalizeNullableValue(
            array_key_exists('car_plate', $validated) ? $validated['car_plate'] : $serviceLog->car_plate
        );
        $stockNumber = $this->normalizeNullableValue(
            array_key_exists('stock_number', $validated) ? $validated['stock_number'] : $serviceLog->stock_number
        );
        $vehicleCondition = array_key_exists('vehicle_condition', $validated)
            ? $validated['vehicle_condition']
            : $serviceLog->vehicle_condition;

        $validationMessage = $this->validateVehicleFields(
            $isNewUsed,
            $vehicleCondition,
            $stockNumber,
            $carPlate
        );

        if ($validationMessage) {
            return response()->json(['message' => $validationMessage], 422);
        }

        if (!$isNewUsed) {
            $vehicleCondition = null;
            $stockNumber = null;
        }

        $serviceLog->fill([
            'company_id' => $companyId,
            'service_id' => $serviceId,
            'department_id' => $effectiveDepartment?->id,
            'car_plate' => $carPlate,
            'vehicle_condition' => $vehicleCondition,
            'stock_number' => $stockNumber,
            'quantity' => $validated['quantity'] ?? $serviceLog->quantity,
        ]);

        if (array_key_exists('date', $validated)) {
            $serviceLog->performed_at = $validated['date'];
        }

        if (array_key_exists('notes', $validated)) {
            $serviceLog->notes = $validated['notes'];
        }

        $serviceLog->save();
        $serviceLog->load($this->logRelations($user));

        return response()->json([
            'message' => 'Service entry updated successfully.',
            'data' => $serviceLog,
        ]);
    }

    public function destroy(Request $request, ServiceLog $serviceLog)
    {
        $user = $request->user();

        if (!$this->canManageLog($user, $serviceLog)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $serviceLog->delete();

        return response()->json([
            'message' => 'ServiceLog deleted successfully.',
            'data' => [
                'id' => $serviceLog->id,
            ],
        ], 204);
    }


    private function logRelations(User $user): array
    {
        $serviceColumns = 'id,department_id,type,description,value'
            . ($user->canSeeCosts() ? ',cost_value' : '');

        return [
            'user:id,display_name,full_name',
            'company:id,name,display_name',
            'service:' . $serviceColumns,
            'service.department:id,name,description,bill_by_unit,bill_by_hour,bill_by_quantity',
            'department:id,name,description,bill_by_unit,bill_by_hour,bill_by_quantity',
        ];
    }

    private function canManageLog(User $user, ServiceLog $log): bool
    {
        if (!$this->ensureCompanyAllowed($user, $log->company_id)) {
            return false;
        }

        return $user->canManageAllServiceLogs() || $log->user_id === $user->id;
    }

    private function normalizeNullableValue(?string $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : strtoupper($value);
    }

    private function validateVehicleFields(
        bool $isNewUsed,
        ?string $vehicleCondition,
        ?string $stockNumber,
        ?string $carPlate
    ): ?string {
        if ($isNewUsed) {
            if (!$vehicleCondition) {
                return 'Vehicle condition is required.';
            }

            if (!$stockNumber) {
                return 'Stock number is required.';
            }

            if ($vehicleCondition === 'used' && !$carPlate) {
                return 'Vehicle plate is required for used cars.';
            }

            return null;
        }

        return $carPlate ? null : 'Vehicle plate is required.';
    }

    private function serializeLog(ServiceLog $log): array
    {
        return [
            'id' => $log->id,
            'company_id' => $log->company_id,
            'service_id' => $log->service_id,
            'department_id' => $log->department_id,
            'department' => $log->relationLoaded('department') && $log->department
                ? [
                    'id' => $log->department->id,
                    'name' => $log->department->name,
                    'description' => $log->department->description,
                    'bill_by_unit' => $log->department->bill_by_unit,
                    'bill_by_hour' => $log->department->bill_by_hour,
                    'bill_by_quantity' => $log->department->bill_by_quantity,
                ]
                : null,
            'car_plate' => $log->car_plate,
            'vehicle_condition' => $log->vehicle_condition,
            'stock_number' => $log->stock_number,
            'performed_at' => $log->performed_at->toDateString(),
            'quantity' => $log->quantity,
            'notes' => $log->notes,
        ];
    }
}
