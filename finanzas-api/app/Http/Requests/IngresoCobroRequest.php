<?php

namespace App\Http\Requests;

use App\Support\IngresosDeCobros;
use Illuminate\Foundation\Http\FormRequest;

class IngresoCobroRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['cobro' => $this->route('receivableId')]);
    }

    public function rules(): array
    {
        $rules = [
            'cobro' => ['bail', 'required', 'string', 'max:80', 'regex:/\A[a-zA-Z0-9-]+\z/'],
        ];

        if ($this->isMethod('POST')) {
            $rules['fuente'] = ['bail', 'required', 'string', 'max:150'];
            $rules['monto'] = ['bail', 'required', 'numeric', 'decimal:0,2', 'gt:0', 'max:9999999999.99'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'cobro.*' => 'El identificador del cobro no es válido.',
            'fuente.required' => 'Escribe el nombre de la persona que te pagó.',
            'fuente.max' => 'La fuente no puede exceder 150 caracteres.',
            'monto.required' => 'Indica el monto del cobro.',
            'monto.numeric' => 'El monto debe ser un número.',
            'monto.decimal' => 'Usa como máximo dos decimales.',
            'monto.gt' => 'El monto debe ser mayor que cero.',
            'monto.max' => 'El monto es demasiado alto.',
        ];
    }

    public function claveDelCobro(): string
    {
        return IngresosDeCobros::clave($this->validated('cobro'));
    }
}
