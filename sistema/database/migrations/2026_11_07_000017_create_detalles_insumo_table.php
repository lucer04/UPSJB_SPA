<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('detalles_insumo', function (Blueprint $table) {
            $table->id();
            $table->foreignId('detalle_cita_id')->constrained('detalles_cita')->cascadeOnDelete();
            $table->foreignId('insumo_id')->constrained('insumos');
            $table->unsignedInteger('cantidad_usada');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('detalles_insumo');
    }
};
