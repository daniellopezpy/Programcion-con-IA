<?php

namespace Database\Factories;

use App\Models\Categoria;
use App\Models\Egreso;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Egreso>
 */
class EgresoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categoria = Categoria::query()
            ->where('tipo', 'egreso')
            ->with('subcategorias')
            ->inRandomOrder()
            ->firstOrFail();
        $centavos = fake()->numberBetween(1500, 65000);

        return [
            'categoria_id' => $categoria->id,
            'subcategoria_id' => $categoria->subcategorias->isEmpty()
                ? null
                : $categoria->subcategorias->random()->id,
            'fecha' => fake()->date(),
            'descripcion' => fake()->randomElement([
                'Compra del día',
                'Pago mensual',
                'Gasto universitario',
                'Servicio personal',
            ]),
            'monto' => sprintf('%d.%02d', intdiv($centavos, 100), $centavos % 100),
            'notas' => fake()->optional()->sentence(),
        ];
    }
}
