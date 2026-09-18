<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Subcategoria;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CategoriaApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_combina_categorias_del_sistema_y_propias(): void
    {
        $ana = User::factory()->create();
        $luis = User::factory()->create();
        $sistema = Categoria::create(['nombre' => 'Vivienda', 'tipo' => 'egreso']);
        Subcategoria::create(['categoria_id' => $sistema->id, 'nombre' => 'Internet']);
        $ana->categorias()->create(['nombre' => 'Universidad', 'tipo' => 'egreso']);
        $luis->categorias()->create(['nombre' => 'Privada de Luis', 'tipo' => 'egreso']);
        Categoria::create(['nombre' => 'Empleo', 'tipo' => 'ingreso']);

        Sanctum::actingAs($ana);

        $response = $this->getJson('/api/categorias?tipo=egreso')->assertOk();

        $response->assertJsonCount(2);
        $this->assertEqualsCanonicalizing(
            ['Universidad', 'Vivienda'],
            collect($response->json())->pluck('nombre')->all(),
        );
        $this->assertSame('Internet', collect($response->json())->firstWhere('nombre', 'Vivienda')['subcategorias'][0]['nombre']);
    }

    public function test_store_asigna_propietario_y_no_permite_modificar_categoria_del_sistema(): void
    {
        $ana = User::factory()->create();
        $sistema = Categoria::create(['nombre' => 'Vivienda', 'tipo' => 'egreso']);
        Sanctum::actingAs($ana);

        $this->postJson('/api/categorias', [
            'nombre' => 'Materiales',
            'tipo' => 'egreso',
        ])->assertCreated();

        $this->assertDatabaseHas('categorias', [
            'user_id' => $ana->id,
            'nombre' => 'Materiales',
        ]);

        $this->patchJson("/api/categorias/{$sistema->id}", [
            'nombre' => 'Alterada',
            'tipo' => 'egreso',
        ])->assertNotFound();
        $this->deleteJson("/api/categorias/{$sistema->id}")->assertNotFound();
    }

    public function test_rutas_protegidas_rechazan_solicitudes_sin_token(): void
    {
        $this->getJson('/api/categorias')->assertUnauthorized();
        $this->getJson('/api/egresos')->assertUnauthorized();
    }
}
