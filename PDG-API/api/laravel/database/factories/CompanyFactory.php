<?php

namespace Database\Factories;

use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

class CompanyFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name'         => $this->faker->company(),
            'display_name' => $this->faker->companySuffix(),
            'email'        => $this->faker->unique()->safeEmail(),
            'address'      => $this->faker->streetAddress(),
            'phone'        => '+351 9' . $this->faker->numerify('########'),
            'default_service_id' => Service::query()->inRandomOrder()->value('id') ?? Service::factory(),
        ];
    }
}
