<?php

namespace Database\Factories;

use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Service> */
class ServiceFactory extends Factory
{
    protected $model = Service::class;

    public function definition(): array
    {
        return [
            'type'        => fake()->unique()->words(2, true),
            'description' => fake()->sentence(8),
            'value'       => fake()->randomFloat(2, 50, 500),
        ];
    }
}
