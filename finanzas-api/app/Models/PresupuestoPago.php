<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['limite', 'fecha_inicio', 'fecha_pago'])]
class PresupuestoPago extends Model
{
    protected $table = 'presupuestos_pago';

    protected function casts(): array
    {
        return [
            'limite' => 'decimal:2',
            'fecha_inicio' => 'immutable_date',
            'fecha_pago' => 'immutable_date',
        ];
    }
}
