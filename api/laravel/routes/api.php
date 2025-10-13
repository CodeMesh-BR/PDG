<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserRegistrationController;
use App\Http\Controllers\UserController;

// Preflight CORS (opcional)
Route::options('{any}', fn() => response()->noContent())->where('any', '.*');

// Cadastro (create)
Route::post('/users', [UserRegistrationController::class, 'store']);

// Show / Update / Delete
Route::get('/users/{user}', [UserController::class, 'show']);
Route::match(['put', 'patch'], '/users/{user}', [UserController::class, 'update']);
Route::delete('/users/{user}', [UserController::class, 'destroy']);
