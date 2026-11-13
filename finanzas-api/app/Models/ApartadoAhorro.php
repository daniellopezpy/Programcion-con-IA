<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['operacion', 'monto'])]
class ApartadoAhorro extends Model
{
    protected $table = 'apartados_ahorro';

    protected function casts(): array
    {
        return ['monto' => 'decimal:2'];
    }
}
