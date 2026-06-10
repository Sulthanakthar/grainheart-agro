from rest_framework import permissions

class IsAdminRole(permissions.BasePermission):
    """
    Grants access only to Administrators.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')

class IsSalesRole(permissions.BasePermission):
    """
    Grants access only to Sales Executives.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'sales')

class IsInventoryRole(permissions.BasePermission):
    """
    Grants access only to Inventory Managers.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'inventory')

class IsDealerRole(permissions.BasePermission):
    """
    Grants access only to Dealers.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'dealer')

class IsCustomerRole(permissions.BasePermission):
    """
    Grants access only to Customers.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'customer')

class IsEmployee(permissions.BasePermission):
    """
    Grants access to any internal employee role (Admin, Sales, Inventory).
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['admin', 'sales', 'inventory'])
