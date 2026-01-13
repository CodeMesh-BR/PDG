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

        $defaultServiceId = $serviceIds[array_rand($serviceIds)];

        $alpha = Company::updateOrCreate(
            ['email' => 'alpha@example.com'],
            [
                'name'         => 'Loja Alpha',
                'display_name' => 'Alpha Central',
                'address'      => 'Rua X, 123',
                'phone'        => '+351 900 000 000',
                'default_service_id' => $defaultServiceId,
            ]
        );

        $alphaServices = collect($serviceIds)
            ->shuffle()
            ->take(3)
            ->push($defaultServiceId)
            ->unique()
            ->all();
        $alpha->services()->sync($alphaServices);

        Company::factory()
            ->count(9)
            ->state(fn () => ['default_service_id' => $serviceIds[array_rand($serviceIds)]])
            ->create()
            ->each(function (Company $c) use ($serviceIds) {
                $defaultServiceId = $c->default_service_id;
                $services = collect($serviceIds)
                    ->shuffle()
                    ->take(rand(1, 4))
                    ->push($defaultServiceId)
                    ->unique()
                    ->all();
                $c->services()->sync($services);
        });
    }
}
