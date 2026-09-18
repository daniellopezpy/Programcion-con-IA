<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class DashboardAnioRequest extends FormRequest
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
        ];
    }

    public function messages(): array
    {
        return [
            'anio.required' => 'Debes indicar el año.',
            'anio.integer' => 'El año debe ser un número entero.',
            'anio.between' => 'El año debe estar entre 2000 y 2100.',
        ];
    }
}
