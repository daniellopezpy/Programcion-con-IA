<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class IndexIngresoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'anio' => ['nullable', 'integer', 'between:2000,2100', 'required_with:mes'],
            'mes' => ['nullable', 'integer', 'between:1,12', 'required_with:anio'],
        ];
    }

    public function messages(): array
    {
        return [
            'anio.required_with' => 'Debes enviar el año junto con el mes.',
            'anio.integer' => 'El año debe ser un número entero.',
            'anio.between' => 'El año debe estar entre 2000 y 2100.',
            'mes.required_with' => 'Debes enviar el mes junto con el año.',
            'mes.integer' => 'El mes debe ser un número entero.',
            'mes.between' => 'El mes debe estar entre 1 y 12.',
        ];
    }
}
