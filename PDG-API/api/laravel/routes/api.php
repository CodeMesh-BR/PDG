<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\UserRegistrationController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\PlateOcrController;
use App\Http\Controllers\ServiceLogController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\DashboardController;


// Preflight CORS (opcional)
Route::options('{any}', fn() => response()->noContent())->where('any', '.*');

// Auth (público)
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);

Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/logout-all', [AuthController::class, 'logoutAll']);

    // Users
    Route::post('/users', [UserRegistrationController::class, 'store']);
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{user}', [UserController::class, 'show']);
    Route::match(['put', 'patch'], '/users/{user}', [UserController::class, 'update']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);

    // Services
    Route::post('/services', [ServiceController::class, 'store']);
    Route::get('/services', [ServiceController::class, 'index']);
    Route::get('/services/{service}', [ServiceController::class, 'show']);
    Route::match(['put', 'patch'], '/services/{service}', [ServiceController::class, 'update']);
    Route::delete('/services/{service}', [ServiceController::class, 'destroy']);

    // Companies
    Route::post('/companies', [CompanyController::class, 'store']);
    Route::get('/companies', [CompanyController::class, 'index']);
    Route::get('/companies/{company}', [CompanyController::class, 'show']);
    Route::match(['put', 'patch'], '/companies/{company}', [CompanyController::class, 'update']);
    Route::delete('/companies/{company}', [CompanyController::class, 'destroy']);

    // Plate OCR
    Route::post('/plate-ocr', [PlateOcrController::class, 'readPlate']);
    Route::post('/plate-ocr/debug', [PlateOcrController::class, 'debug']);
    Route::post('/plate-ocr/ping', [PlateOcrController::class, 'ping']);

    // Services Logs
    Route::post('/service-logs', [ServiceLogController::class, 'store']);
    Route::get('/service-logs',  [ServiceLogController::class, 'index']);
    Route::delete('/service-logs/{serviceLog}',  [ServiceLogController::class, 'destroy']);

    // Reports
    Route::get('/reports/services', [ReportController::class, 'services']);
    Route::get('/reports/services/summary', [ReportController::class, 'servicesSummary']);

    // Dashboard
    Route::get('/dashboard/overview', [DashboardController::class, 'overview']);
    Route::get('/dashboard/today-by-company', [DashboardController::class, 'todayByCompany']);
});
