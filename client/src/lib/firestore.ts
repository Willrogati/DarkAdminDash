import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import type { User } from "firebase/auth";

// Coleção de usuários
const USERS_COLLECTION = "users";

// Interface para os dados do usuário no Firestore
export interface FirestoreUser {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cria ou atualiza os dados do usuário no Firestore após autenticação
 */
export async function syncUserWithFirestore(authUser: User): Promise<FirestoreUser | null> {
  if (!authUser) return null;
  
  try {
    // Verificar se o usuário já existe
    const userRef = doc(db, USERS_COLLECTION, authUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Usuário já existe, atualizar dados se necessário
      const userData = userDoc.data() as FirestoreUser;
      
      // Verificar se é necessário atualizar
      if (
        userData.name !== authUser.displayName || 
        userData.email !== authUser.email || 
        userData.imageUrl !== authUser.photoURL
      ) {
        await updateDoc(userRef, {
          name: authUser.displayName || userData.name,
          email: authUser.email || userData.email,
          imageUrl: authUser.photoURL || userData.imageUrl,
          updatedAt: serverTimestamp()
        });
        
        // Retornar dados atualizados
        return {
          ...userData,
          name: authUser.displayName || userData.name,
          email: authUser.email || userData.email,
          imageUrl: authUser.photoURL || userData.imageUrl,
          updatedAt: new Date()
        };
      }
      
      return userData;
    } else {
      // Usuário não existe, criar novo
      const newUser: Omit<FirestoreUser, 'createdAt' | 'updatedAt'> & {
        createdAt: any;
        updatedAt: any;
      } = {
        id: authUser.uid,
        name: authUser.displayName || "Usuário",
        email: authUser.email || "",
        imageUrl: authUser.photoURL || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userRef, newUser);
      
      // Retornar o novo usuário
      return {
        ...newUser, 
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  } catch (error) {
    console.error("Erro ao sincronizar usuário com Firestore:", error);
    return null;
  }
}

/**
 * Busca os dados de um usuário no Firestore
 */
export async function getUserFromFirestore(userId: string): Promise<FirestoreUser | null> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as FirestoreUser;
    }
    
    return null;
  } catch (error) {
    console.error("Erro ao buscar usuário do Firestore:", error);
    return null;
  }
}

/**
 * Atualiza os dados de um usuário no Firestore
 */
export async function updateUserInFirestore(
  userId: string, 
  userData: Partial<Omit<FirestoreUser, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<boolean> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    
    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Erro ao atualizar usuário no Firestore:", error);
    return false;
  }
}