import { Orcamento, ItemOrcamento, User, Role } from "@prisma/client";

// Define a type for the full budget object including items and user
interface FullOrcamento extends Orcamento {
  itens: ItemOrcamento[];
  vendedor?: User | null; // Vendedor can be null if not assigned or if it's an admin action
}

interface BusinessRuleValidationResult {
  isValid: boolean;
  requiresAdminApproval?: boolean;
  messages: string[];
}

const MAX_DISCOUNT_PERCENTAGE_VENDEDOR = 10; // Vendedor can give up to 10% discount
const MAX_DISCOUNT_PERCENTAGE_ADMIN_WITHOUT_ALERT = 20; // Admin can give up to 20% without special alert

/**
 * Collection of configurable business rules used across the application.
 */
export const businessRules = {
  nfe: {
    /**
     * Number of days after the emission date to use as a fallback due date
     * when an imported NFe does not specify one.
     */
    fallbackDueDateDays: 30,
  },
} as const;

/**
 * Validates a budget against defined business rules.
 * For now, focuses on discount rules.
 */
export function validateOrcamentoBusinessRules(
  orcamento: FullOrcamento,
  discountPercentage: number = 0, // Overall discount percentage applied to the budget
  currentUser: User
): BusinessRuleValidationResult {
  const result: BusinessRuleValidationResult = {
    isValid: true,
    messages: [],
  };

  // Rule 1: Discount limits based on user role
  if (discountPercentage > 0) {
    if (currentUser.role === Role.VENDEDOR) {
      if (discountPercentage > MAX_DISCOUNT_PERCENTAGE_VENDEDOR) {
        result.isValid = false; // Or it could be valid but require approval
        result.requiresAdminApproval = true;
        result.messages.push(
          `Desconto de ${discountPercentage}% excede o limite de ${MAX_DISCOUNT_PERCENTAGE_VENDEDOR}% para Vendedor. Aprovação do Admin é necessária.`
        );
      }
    } else if (currentUser.role === Role.ADMIN) {
      if (discountPercentage > MAX_DISCOUNT_PERCENTAGE_ADMIN_WITHOUT_ALERT) {
        // Admin can approve higher, but we might want to log or flag this
        result.messages.push(
          `Alerta: Desconto de ${discountPercentage}% é alto, mas permitido para Admin.`
        );
      }
    } else {
      // Other roles might not be allowed to give discounts
      result.isValid = false;
      result.messages.push(`Usuário com papel '${currentUser.role}' não pode aplicar descontos.`);
    }
  }

  // Rule 2: Minimum budget value (example)
  // const subtotal = orcamento.itens.reduce((sum, item) => sum + (item.precoFinal || 0), 0);
  // if (subtotal < 50) { // Example minimum
  //   result.isValid = false;
  //   result.messages.push("O valor mínimo para um orçamento é R$50,00.");
  // }

  // Add more rules here as needed:
  // - Product availability / stock checks (Phase 3)
  // - Specific product combination rules
  // - Payment condition validations

  if (result.messages.length > 0 && result.isValid && !result.requiresAdminApproval) {
    // If there are messages but it's still valid (e.g. warnings for admin), reflect that
  } else if (result.messages.length > 0 && !result.isValid) {
    // Standard invalid case
  }


  return result;
}

/**
 * Placeholder for more complex pricing logic if needed.
 * For now, prices are assumed to be set directly on ItemOrcamento.
 */
export function calculateItemPrice(itemData: any): number {
  // This could involve lookups in a price table, applying vendor-specific rules, etc.
  // For MVP, we assume precoUnitario and metragem are provided or calculated simply.
  if (itemData.precoFinal) {
    return itemData.precoFinal;
  }
  if (itemData.metragem && itemData.precoUnitario) {
    return itemData.metragem * itemData.precoUnitario;
  }
  return 0;
}

