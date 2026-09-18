<?php

namespace Database\Factories;

use App\Models\Categoria;
use App\Models\Ingreso;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Ingreso>
 */
class IngresoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $centavos = fake()->numberBetween(150000, 350000);

        return [
            'categoria_id' => Categoria::query()
                ->where('tipo', 'ingreso')
                ->inRandomOrder()
                ->firstOrFail()
                ->getKey(),
            'fecha' => fake()->date(),
            'fuente' => fake()->randomElement([
                'Trabajo de medio tiempo',
                'Proyecto freelance',
                'Apoyo familiar',
                'Venta ocasional',
            ]),
            'monto' => sprintf('%d.%02d', intdiv($centavos, 100), $centavos % 100),
            'notas' => fake()->optional()->sentence(),
        ];
    }
}
