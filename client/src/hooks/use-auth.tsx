import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { syncUserWithFirestore, type FirestoreUser, updateUserInFirestore } from "@/lib/firestore";

interface AuthContextType {
  user: User | null;
  userData: FirestoreUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: { name?: string; imageUrl?: string }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      
      if (authUser) {
        // Sincronizar com Firestore
        try {
          const firestoreUser = await syncUserWithFirestore(authUser);
          setUserData(firestoreUser);
        } catch (error) {
          console.error("Error syncing with Firestore:", error);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      let message = "Falha ao fazer login";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        message = "Email ou senha incorretos";
      }
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Atualizar o perfil com o nome
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: name
        });
        
        // Recarregar usuário para obter os dados atualizados
        await userCredential.user.reload();
        setUser(auth.currentUser);
        
        // Sincronizar com Firestore
        const firestoreUser = await syncUserWithFirestore(userCredential.user);
        setUserData(firestoreUser);
      }
    } catch (error: any) {
      let message = "Falha ao criar conta";
      if (error.code === "auth/email-already-in-use") {
        message = "Este email já está em uso";
      } else if (error.code === "auth/weak-password") {
        message = "A senha é muito fraca";
      } else if (error.code === "auth/invalid-email") {
        message = "Email inválido";
      }
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      
      // Sincronizar com Firestore
      if (result.user) {
        const firestoreUser = await syncUserWithFirestore(result.user);
        setUserData(firestoreUser);
      }
    } catch (error: any) {
      let message = "Falha ao fazer login com Google";
      if (error.code === "auth/popup-closed-by-user") {
        message = "Login cancelado";
      } else if (error.code === "auth/operation-not-allowed") {
        message = "Login com Google não está habilitado na configuração do Firebase";
      } else if (error.code === "auth/configuration-not-found") {
        message = "Configuração de domínio no Firebase não encontrada";
      }
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao sair da conta",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateUserProfile = async (data: { name?: string; imageUrl?: string }): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);
      
      // Atualizar o perfil no Firebase Auth
      const updates: { displayName?: string; photoURL?: string } = {};
      
      if (data.name) {
        updates.displayName = data.name;
      }
      
      if (data.imageUrl) {
        updates.photoURL = data.imageUrl;
      }
      
      if (Object.keys(updates).length > 0) {
        await updateProfile(user, updates);
        
        // Recarregar o usuário para obter os dados atualizados
        await user.reload();
        setUser(auth.currentUser);
      }
      
      // Atualizar no Firestore
      const firestoreUpdates: Partial<Omit<FirestoreUser, 'id' | 'createdAt' | 'updatedAt'>> = {};
      
      if (data.name) {
        firestoreUpdates.name = data.name;
      }
      
      if (data.imageUrl) {
        firestoreUpdates.imageUrl = data.imageUrl;
      }
      
      if (Object.keys(firestoreUpdates).length > 0) {
        const success = await updateUserInFirestore(user.uid, firestoreUpdates);
        
        if (success && userData) {
          // Atualizar dados locais
          setUserData({
            ...userData,
            ...firestoreUpdates,
            updatedAt: new Date()
          });
        }
        
        return success;
      }
      
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar perfil",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    userData,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}