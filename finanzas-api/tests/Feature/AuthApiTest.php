<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_un_usuario_puede_registrarse_y_recibe_un_token(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Ana López',
            'email' => 'ana@example.com',
            'password' => 'Finanzas2026!',
            'password_confirmation' => 'Finanzas2026!',
        ]);

        $response
            ->assertCreated()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']])
            ->assertJsonMissingPath('user.password');

        $user = User::query()->where('email', 'ana@example.com')->firstOrFail();
        $this->assertTrue(Hash::check('Finanzas2026!', $user->password));
    }

    public function test_login_y_logout_revocan_solo_el_token_actual(): void
    {
        $user = User::factory()->create([
            'email' => 'ana@example.com',
            'password' => 'Finanzas2026!',
        ]);
        $tokenAnterior = $user->createToken('otro-dispositivo');

        $login = $this->postJson('/api/login', [
            'email' => 'ana@example.com',
            'password' => 'Finanzas2026!',
        ])->assertOk();

        $this->withToken($login->json('token'))->postJson('/api/logout')->assertNoContent();

        $this->assertDatabaseHas('personal_access_tokens', ['id' => $tokenAnterior->accessToken->id]);
        $this->assertDatabaseCount('personal_access_tokens', 1);
    }
}
