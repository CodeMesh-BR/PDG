<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            [
                'name' => 'Yard',
                'description' => 'Charged for multiple cars at once.',
                'bill_by_unit' => false,
                'bill_by_hour' => false,
                'bill_by_quantity' => true,
            ],
            [
                'name' => 'Service',
                'description' => 'Charged per car.',
                'bill_by_unit' => true,
                'bill_by_hour' => false,
                'bill_by_quantity' => false,
            ],
            [
                'name' => 'Outsourcing / hour',
                'description' => 'Charged by hour.',
                'bill_by_unit' => false,
                'bill_by_hour' => true,
                'bill_by_quantity' => false,
            ],
            [
                'name' => 'New / Used',
                'description' => 'Charged per unit using stock number.',
                'bill_by_unit' => true,
                'bill_by_hour' => false,
                'bill_by_quantity' => false,
            ],
        ];

        foreach ($departments as $item) {
            Department::updateOrCreate(
                ['name' => $item['name']],
                $item
            );
        }
    }
}
