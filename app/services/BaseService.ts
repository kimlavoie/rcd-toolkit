import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    getDoc
} from "firebase/firestore";
import { firestore, auth } from "@/app/utilities/firebase";
import { Schemas } from "@/app/db/schemas";
import { toast } from "react-hot-toast";
import { z } from "zod";

export class BaseService<T> {
    protected collectionName: string;
    protected schema: any;

    constructor(collectionName: string) {
        this.collectionName = collectionName;
        this.schema = Schemas[collectionName];
    }

    protected async getDepartementId() {
        if (typeof window !== 'undefined') {
            const mockUser = localStorage.getItem('cypress-user');
            if (mockUser) return JSON.parse(mockUser).departementId || 'mock-dept';
        }
        
        if (auth.currentUser) {
            const tokenResult = await auth.currentUser.getIdTokenResult();
            return tokenResult.claims.departementId as string;
        }
        return null;
    }

    protected isMock() {
        return typeof window !== 'undefined' && localStorage.getItem(`cypress-db-${this.collectionName}`) !== null;
    }

    async add(data: any): Promise<{ id: string }> {
        if (this.isMock()) {
            const id = "mock-" + Math.random().toString(36).substr(2, 9);
            const current = JSON.parse(localStorage.getItem(`cypress-db-${this.collectionName}`) || '[]');
            const newData = { ...data, id, departementId: await this.getDepartementId() };
            current.push(newData);
            localStorage.setItem(`cypress-db-${this.collectionName}`, JSON.stringify(current));
            window.dispatchEvent(new CustomEvent('cypress-db-changed', { detail: { collection: this.collectionName } }));
            return { id };
        }
        
        const departementId = await this.getDepartementId();
        if (!departementId && this.collectionName !== 'departements') throw new Error("Un département est requis pour cette opération");
        
        const { id, userId, ...rest } = data; // Strip old userId if present

        if (this.schema) {
            const result = this.schema.safeParse(rest);
            if (!result.success) {
                const errorMsg = result.error.issues.map((e: any) => e.message).join(", ");
                toast.error(`Erreur: ${errorMsg}`);
                throw new Error(errorMsg);
            }
        }

        const payload = this.collectionName === 'departements' ? rest : { ...rest, departementId };
        const docRef = await addDoc(collection(firestore, this.collectionName), payload);
        return { id: docRef.id };
    }

    async update(id: string, data: any): Promise<void> {
        if (this.isMock()) {
            const current = JSON.parse(localStorage.getItem(`cypress-db-${this.collectionName}`) || '[]');
            const index = current.findIndex((item: any) => item.id === id);
            if (index !== -1) {
                current[index] = { ...current[index], ...data };
                localStorage.setItem(`cypress-db-${this.collectionName}`, JSON.stringify(current));
                window.dispatchEvent(new CustomEvent('cypress-db-changed', { detail: { collection: this.collectionName } }));
            }
            return;
        }

        const departementId = await this.getDepartementId();
        if (!departementId && this.collectionName !== 'departements') throw new Error("Un département est requis");

        const docRef = doc(firestore, this.collectionName, id);
        
        // Security is now handled mostly by Firestore rules, but we can keep a client-side check if needed
        // For simplicity and reliance on robust backend rules, we trust the updateDoc call to fail if unauthorized.

        const { id: _, userId: __, departementId: ___, ...rest } = data; // Strip structural fields

        if (this.schema instanceof z.ZodObject) {
            const result = this.schema.partial().safeParse(rest);
            if (!result.success) {
                const errorMsg = result.error.issues.map((e: any) => e.message).join(", ");
                toast.error(`Erreur: ${errorMsg}`);
                throw new Error(errorMsg);
            }
        }

        await updateDoc(docRef, rest);
    }

    async delete(id: string): Promise<void> {
        if (this.isMock()) {
            const current = JSON.parse(localStorage.getItem(`cypress-db-${this.collectionName}`) || '[]');
            const filtered = current.filter((item: any) => item.id !== id);
            localStorage.setItem(`cypress-db-${this.collectionName}`, JSON.stringify(filtered));
            window.dispatchEvent(new CustomEvent('cypress-db-changed', { detail: { collection: this.collectionName } }));
            return;
        }

        const docRef = doc(firestore, this.collectionName, id);
        await deleteDoc(docRef);
    }
}
