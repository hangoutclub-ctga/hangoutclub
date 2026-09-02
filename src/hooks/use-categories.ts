// This file is no longer needed as categories are fetched in the global data provider.
// It is kept here to avoid breaking imports, but it should be removed in a future cleanup.
export const useCategories = () => ({
    studentConditions: [],
    classModalities: [],
    inventoryCategories: [],
    userRoles: [],
    communicationTemplates: [],
    isLoading: true,
});
