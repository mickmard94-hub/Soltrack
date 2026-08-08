<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // GET /api/notifications
    public function index(Request $request)
    {
        return AppNotification::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();
    }

    // GET /api/notifications/non-lues-count
    public function nonLuesCount(Request $request)
    {
        $compte = AppNotification::where('user_id', $request->user()->id)
            ->where('lue', false)
            ->count();

        return response()->json(['compte' => $compte]);
    }

    // PUT /api/notifications/{notification}/lue
    public function marquerLue(Request $request, AppNotification $notification)
    {
        if ($notification->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $notification->update(['lue' => true]);

        return response()->json($notification);
    }

    // PUT /api/notifications/tout-marquer-lu
    public function toutMarquerLu(Request $request)
    {
        AppNotification::where('user_id', $request->user()->id)
            ->where('lue', false)
            ->update(['lue' => true]);

        return response()->json(['message' => 'Toutes les notifications sont marquées comme lues.']);
    }
}