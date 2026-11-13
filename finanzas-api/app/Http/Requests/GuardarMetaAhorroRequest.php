<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class GuardarMetaAhorroRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'anio' => ['required', 'integer', 'between:2000,2100'],
            'mes' => ['required', 'integer', 'between:1,12'],
            'monto_objetivo' => ['required', 'numeric', 'gt:0', 'max:9999999999.99'],
        ];
    }

    public function messages(): array
    {
        return [
            'anio.required' => 'Debes indicar el año.',
            'anio.integer' => 'El año debe ser un número entero.',
            'anio.between' => 'El año debe estar entre 2000 y 2100.',
            'mes.required' => 'Debes indicar el mes.',
            'mes.integer' => 'El mes debe ser un número entero.',
            'mes.between' => 'El mes debe estar entre 1 y 12.',
            'monto_objetivo.required' => 'Debes indicar el monto de la meta.',
            'monto_objetivo.numeric' => 'El monto de la meta debe ser numérico.',
            'monto_objetivo.gt' => 'El monto de la meta debe ser mayor que cero.',
            'monto_objetivo.max' => 'El monto de la meta es demasiado alto.',
        ];
    }
}
