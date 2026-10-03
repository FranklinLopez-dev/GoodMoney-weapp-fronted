import { DocumentType } from 'src/app/core/models/settings/document-type.model';
import { IDynamicValidatable } from 'src/app/shared/services/dynamic-validators.service';
import { Banks } from '../core/models';

export function mapDocumentToValidatable(doc: DocumentType | null, isRequired = true): IDynamicValidatable | null {
    if (!doc) return null;
    return {
        sizeMin: doc.sizeMin,
        sizeMax: doc.sizeMax,
        isRequired: isRequired,
        isNumeric: doc.isNumeric,
        isExact: doc.isExact,
        pattern: undefined
    };
}

export function mapBankToValidatable(bank: Banks | null): IDynamicValidatable | null {
    if (!bank) return null;
    return {
        sizeMin: bank.minAcount,
        sizeMax: bank.maxAcount,
        isRequired: true,
        isNumeric: true,
        isExact: bank.minAcount == bank.maxAcount,
        pattern: undefined
    };
}

export function mapBankCciToValidatable(bank: Banks | null): IDynamicValidatable | null {
    if (!bank) return null;
    return {
        sizeMin: bank.minAcountInter,
        sizeMax: bank.maxAcountInter,
        isRequired: true,
        isNumeric: true,
        isExact: bank.minAcountInter == bank.maxAcountInter,
        pattern: undefined
    };
}

