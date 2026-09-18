<?php

namespace Tests\Feature;

use Database\Seeders\CategoriaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoriaSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_el_catalogo_se_puede_cargar_dos_veces_sin_duplicados(): void
    {
        $this->seed(CategoriaSeeder::class);
        $this->seed(CategoriaSeeder::class);

        $this->assertDatabaseCount('categorias', 15);
        $this->assertDatabaseCount('subcategorias', 24);
        $this->assertDatabaseHas('categorias', [
            'user_id' => null,
            'nombre' => 'Vivienda',
            'tipo' => 'egreso',
        ]);
        $this->assertDatabaseHas('subcategorias', [
            'nombre' => 'Internet',
        ]);
    }
}
