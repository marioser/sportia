"""
Authentication and authorization utilities for FastAPI endpoints.
"""

from fastapi import HTTPException, Header, status
from app.services.supabase_client import get_supabase_admin
from typing import Optional


async def get_current_user(authorization: str = Header(None)):
    """
    Get current authenticated user from JWT token.
    Raises HTTPException if token is invalid or missing.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se proporcionó token de autenticación"
        )

    # Extract token from "Bearer <token>" format
    try:
        scheme, token = authorization.split(" ")
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Esquema de autenticación inválido"
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Formato de autenticación inválido"
        )

    # Verify token with Supabase
    supabase = get_supabase_admin()

    try:
        # Get user from token
        user_response = supabase.auth.get_user(token)

        if not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido o expirado"
            )

        return user_response.user

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Error al verificar token: {str(e)}"
        )


async def require_admin(authorization: str = Header(None)):
    """
    Require that the current user has ADMIN role.
    Raises HTTPException if user is not authenticated or not an admin.
    """
    user = await get_current_user(authorization)

    # Get user profile to check role
    supabase = get_supabase_admin()

    try:
        result = supabase.table("profiles").select("role").eq("id", user.id).single().execute()

        if not result.data or result.data.get("role") != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acceso denegado. Se requiere rol de administrador."
            )

        return user

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al verificar permisos: {str(e)}"
        )
