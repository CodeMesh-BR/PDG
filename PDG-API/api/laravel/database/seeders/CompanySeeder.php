<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Company;
use App\Models\Service;

class CompanySeeder extends Seeder
{
    public function run(): void
    {
        $serviceIds = Service::pluck('id')->all();
        if (empty($serviceIds)) {
            return;
        }

        $alpha = Company::updateOrCreate(
            ['email' => 'alpha@example.com'],
            [
                'name'         => 'Loja Alpha',
                'display_name' => 'Alpha Central',
                'address'      => 'Rua X, 123',
                'phone'        => '+351 900 000 000',
            ]
        );

        $alpha->services()->sync(collect($serviceIds)->shuffle()->take(3)->all());

        Company::factory()->count(9)->create()->each(function (Company $c) use ($serviceIds) {
            $c->services()->sync(collect($serviceIds)->shuffle()->take(rand(1, 4))->all());
        });
    }
}
