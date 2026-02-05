"""
Admin routes for user account management.
Requires ADMIN role for all endpoints.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from app.services.auth import get_current_user, require_admin
from app.services.supabase_client import get_supabase_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


class CreateUserAccountRequest(BaseModel):
    athlete_id: str
    email: EmailStr
    password: str
    full_name: str


class UpdateEmailRequest(BaseModel):
    user_id: str
    new_email: EmailStr


class UpdatePasswordRequest(BaseModel):
    user_id: str
    new_password: str


@router.get("/athletes/{athlete_id}/user-account")
async def get_athlete_user_account(
    athlete_id: str,
    current_user = Depends(require_admin)
):
    """Get user account info for an athlete (admin only)."""
    supabase = get_supabase_admin()

    # Get athlete's user_id
    result = supabase.table("athletes").select("user_id").eq("id", athlete_id).single().execute()

    if not result.data or not result.data.get("user_id"):
        return {"has_account": False, "user_account": None}

    user_id = result.data["user_id"]

    # Get profile info
    profile_result = supabase.table("profiles").select("id, full_name, role").eq("id", user_id).single().execute()

    if not profile_result.data:
        return {"has_account": False, "user_account": None}

    # Get auth user email
    try:
        auth_result = supabase.auth.admin.get_user_by_id(user_id)
        email = auth_result.user.email if auth_result.user else ""
    except Exception:
        email = ""

    return {
        "has_account": True,
        "user_account": {
            "userId": profile_result.data["id"],
            "fullName": profile_result.data["full_name"],
            "email": email,
            "role": profile_result.data["role"],
        }
    }


@router.post("/athletes/create-user-account")
async def create_user_account_for_athlete(
    request: CreateUserAccountRequest,
    current_user = Depends(require_admin)
):
    """Create a user account for an athlete (admin only)."""
    supabase = get_supabase_admin()

    try:
        # Create auth user
        auth_result = supabase.auth.admin.create_user({
            "email": request.email,
            "password": request.password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": request.full_name,
            }
        })

        if not auth_result.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Error al crear usuario"
            )

        # Link athlete to user profile
        update_result = supabase.table("athletes").update({
            "user_id": auth_result.user.id
        }).eq("id", request.athlete_id).execute()

        if not update_result.data:
            # Rollback: delete created user
            try:
                supabase.auth.admin.delete_user(auth_result.user.id)
            except Exception:
                pass

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Error al vincular atleta con usuario"
            )

        return {
            "success": True,
            "user_id": auth_result.user.id,
            "message": "Cuenta de usuario creada exitosamente"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear cuenta: {str(e)}"
        )


@router.post("/users/update-email")
async def update_user_email(
    request: UpdateEmailRequest,
    current_user = Depends(require_admin)
):
    """Update user email (admin only)."""
    supabase = get_supabase_admin()

    try:
        result = supabase.auth.admin.update_user_by_id(
            request.user_id,
            {"email": request.new_email}
        )

        if not result.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Error al actualizar email"
            )

        return {
            "success": True,
            "message": "Email actualizado exitosamente"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar email: {str(e)}"
        )


@router.post("/users/update-password")
async def update_user_password(
    request: UpdatePasswordRequest,
    current_user = Depends(require_admin)
):
    """Update user password (admin only)."""
    supabase = get_supabase_admin()

    try:
        result = supabase.auth.admin.update_user_by_id(
            request.user_id,
            {"password": request.new_password}
        )

        if not result.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Error al actualizar contraseña"
            )

        return {
            "success": True,
            "message": "Contraseña actualizada exitosamente"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar contraseña: {str(e)}"
        )
