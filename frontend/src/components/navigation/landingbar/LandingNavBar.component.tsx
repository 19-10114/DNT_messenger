'use client';

/**
 * LandingNavBar Component - Refactorizado para mejores prácticas
 */
import { UserCircle, Menu, X, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  useUser,
  useAuthService,
  useAuthActions,
  loginUser,
  logoutUser,
} from '@/stores/auth/auth.store';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';
import { useRoles } from '@/stores/auth/auth.store';
import { labelsMap } from '@/hooks/useMappedConstants';
import { DELIVERY_NOTES, ORDERS, PARTS_INVENTORY } from '@/constants/routes';

/**
 * Ruta a la que volver tras iniciar sesión (`?next=/dashboard/...`), puesta
 * por el middleware o el guard de rutas al caducar la sesión. Solo se acepta
 * una ruta interna para no redirigir a otros dominios.
 */
const getNextPath = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  const next = new URLSearchParams(window.location.search).get('next');
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return undefined;
  }
  return next;
};

const LandingNavBar = () => {
  const router = useRouter();
  const user = useUser();
  const authService = useAuthService();
  const { setUser } = useAuthActions();
  const { toast } = useToast();
  const roles = useRoles();
  const firstRole = roles[0];
  // Estado para controlar el menu desplegable
  const [isOpen, setIsOpen] = useState(false);
  const toggleBar = () => setIsOpen(!isOpen);

  // Estado para controlar el modal de inicio de sesión
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const toggleLogin = () => {
    setIsLoginOpen(!isLoginOpen);
    setIsOpen(false);
    setLoginError(null);
    setUsername('');
    setPassword('');
  };

  // Para el icono del ojo (password)
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  // Estados del formulario de login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<any>(null);

  // Estado para el menú del usuario
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Función para scroll suave a las secciones. Fuera de la landing (la barra
  // también se usa en las Páginas públicas) la sección no existe: se va a la
  // landing con `#sección` y allí se hace el scroll al cargar.
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push(`/#${sectionId}`);
    }
  };

  // Llegada con `#sección` (desde una Página): las secciones del catálogo se
  // pintan cuando cargan sus datos, así que se reintenta unos segundos.
  useEffect(() => {
    const sectionId = window.location.hash.slice(1);
    if (!sectionId) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      const element = document.getElementById(sectionId);
      tries += 1;
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        window.clearInterval(timer);
      } else if (tries >= 20) {
        window.clearInterval(timer);
      }
    }, 150);
    return () => window.clearInterval(timer);
  }, []);

  // Si llega con `next` (sesión caducada en el panel) se abre el modal directo
  useEffect(() => {
    if (!user && getNextPath()) setIsLoginOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cerrar menú usuario al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Handler para el login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const user = await authService.login({ username, password });
      if (user) {
        loginUser(user);
        setUser(user);
        setUsername('');
        setPassword('');
        setIsLoginOpen(false);
        toast({
          title: 'Inicio de sesión exitoso',
          description: `Bienvenido ${user.username}`,
        });
        const next = getNextPath();
        if (next) {
          router.replace(next);
        } else {
          router.push('/dashboard/messenger');
        }
      }
    } catch (error: any) {
      setLoginError(error);
      toast({
        title: 'Error de autenticación',
        description: error?.message || 'Usuario o contraseña incorrectos',
        variant: 'destructive',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handler para cerrar sesión
  const handleLogout = async () => {
    try {
      if (!user) return;
      await authService.logout(user.token);
      localStorage.removeItem('TOKEN');
      logoutUser();
      setUser(undefined);
      setUserMenuOpen(false);
      router.push('/');
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión exitosamente',
      });
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  // Handler para ir al panel de usuario
  const goToPanel = () => {
    setUserMenuOpen(false);
    router.push('/dashboard/messenger');
  };

  return (
    <>
      {/* Navbar */}
      <nav
        className={`sticky top-4 w-[95%] md:w-[90%] lg:w-[85%] mx-auto bg-primary backdrop-blur-md rounded-2xl px-4 md:px-6 py-3 flex items-center justify-between shadow-lg shadow-black/30 border border-white/10 ${isLoginOpen ? 'z-[115]' : 'z-40'}`}
      >
        {/* Logo */}
        <button
          onClick={() => {
            setIsOpen(false);
            router.push('/');
          }}
          className="flex-shrink-0 ml-4"
        >
          <Image
            src="/moto-candela-logo.svg"
            alt="Logo"
            className="h-10 md:h-14 w-auto"
            width={600}
            height={400}
            unoptimized
          />
        </button>

        {/* Menu principal (desktop) */}
        <div className="hidden lg:flex items-center gap-1 mx-auto bg-primary backdrop-blur-sm rounded-full px-2 py-1">
          <button
            onClick={() => scrollToSection('inicio')}
            className="px-4 py-2 rounded-full text-white transition-all duration-300 text-md font-medium hover:bg-white/10 hover:backdrop-blur-sm hover:shadow-md hover:shadow-white/20"
          >
            Inicio
          </button>
          <button
            onClick={() => scrollToSection('bikes-catalogue')}
            className="px-4 py-2 rounded-full text-white transition-all duration-300 text-md font-medium hover:bg-white/10 hover:backdrop-blur-sm hover:shadow-md hover:shadow-white/20"
          >
            Motos
          </button>
          <button
            onClick={() => scrollToSection('parts-catalogue')}
            className="px-4 py-2 rounded-full text-white transition-all duration-300 text-md font-medium hover:bg-white/10 hover:backdrop-blur-sm hover:shadow-md hover:shadow-white/20"
          >
            Repuestos
          </button>
          <button
            onClick={() => scrollToSection('cobertura')}
            className="px-4 py-2 rounded-full text-white transition-all duration-300 text-md font-medium hover:bg-white/10 hover:backdrop-blur-sm hover:shadow-md hover:shadow-white/20"
          >
            Cobertura
          </button>
          <button
            onClick={() => scrollToSection('payment-methods')}
            className="px-4 py-2 rounded-full text-white transition-all duration-300 text-md font-medium hover:bg-white/10 hover:backdrop-blur-sm hover:shadow-md hover:shadow-white/20"
          >
            Métodos de Pago
          </button>
          <button
            onClick={() => scrollToSection('contacto')}
            className="px-4 py-2 rounded-full text-white transition-all duration-300 text-md font-medium hover:bg-white/10 hover:backdrop-blur-sm hover:shadow-md hover:shadow-white/20"
          >
            Contacto
          </button>
        </div>

        {/* Botón de login o usuario (solo desktop) */}
        {user ? (
          <div
            className="hidden lg:flex flex-col items-center gap-1 bg-primary backdrop-blur-md rounded-2xl px-4 py-2 relative hover:bg-black/90"
            ref={userMenuRef}
          >
            <button
              className="focus:outline-none flex flex-col items-center"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <UserCircle
                size={32}
                className="text-white hover:text-secondary transition-colors"
              />
              <span className="text-xs text-white/80 mt-1">
                {user.username}
              </span>
              <span className="mt-1 px-2 py-0.5 rounded bg-secondary text-white text-[10px] font-semibold">
                {labelsMap.roles[firstRole]}
              </span>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white/90 backdrop-blur-md text-gray-800 rounded-xl shadow-lg w-48 z-30 border border-white/20">
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-t-xl transition-colors"
                  onClick={goToPanel}
                >
                  Panel de usuario
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-xl transition-colors"
                  onClick={handleLogout}
                >
                  Salir
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden lg:block">
            <button
              onClick={toggleLogin}
              className="flex flex-col items-center gap-1 bg-primary backdrop-blur-md text-white px-4 py-2 rounded-2xl cursor-pointer transition-colors mr-4 hover:bg-white/10 hover:backdrop-blur-sm hover:shadow-md hover:shadow-white/20"
            >
              <UserCircle size={28} />
              <span className="text-xs text-white/80">Acceder</span>
            </button>
          </div>
        )}

        {/* Mobile: hamburger en el centro */}
        <div className="lg:hidden flex-1 flex justify-center">
          <button onClick={toggleBar} className="text-white cursor-pointer">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile: Acceder a la derecha */}
        {!user && (
          <button
            onClick={toggleLogin}
            className="lg:hidden flex flex-col items-center gap-0.5 text-white mr-1"
          >
            <UserCircle size={22} />
            <span className="text-[11px] text-white/70">Acceder</span>
          </button>
        )}
      </nav>

      {/* Modal móvil (centrado) */}
      <AnimatePresence>
        {isLoginOpen && !user && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-[100]"
              onClick={toggleLogin}
            />
            <div className="fixed inset-0 flex items-center justify-center z-[120] pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="w-[280px] bg-black rounded-2xl shadow-2xl p-5 border border-secondary/30 pointer-events-auto relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={toggleLogin}
                  className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
                <h2 className="text-xl font-bold text-white text-center mb-5">
                  Accede a tu cuenta
                </h2>

                <form
                  className="flex flex-col gap-3"
                  onSubmit={handleLoginSubmit}
                >
                  <input
                    type="text"
                    placeholder="Nombre de usuario"
                    className="w-full px-4 py-2.5 text-sm bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent text-white placeholder:text-gray-500"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  <div className="relative w-full">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Contraseña"
                      className="w-full px-4 py-2.5 text-sm bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent text-white placeholder:text-gray-500 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-secondary"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="w-32 mx-auto mt-2 bg-secondary text-black font-semibold py-2.5 rounded-full hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? 'Ingresando...' : 'Iniciar Sesión'}
                  </button>
                  {loginError && (
                    <div className="text-red-400 text-xs text-center mt-2">
                      {loginError.message || 'Usuario o contraseña incorrectos'}
                    </div>
                  )}
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Menu desplegable móvil */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              onClick={toggleBar}
            />
            <div className="fixed top-[76px] left-0 right-0 flex justify-center z-50 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="w-48 bg-primary/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl p-1.5 flex flex-col pointer-events-auto origin-top"
              >
                {user && (
                  <div
                    className="flex items-center gap-2 px-3 py-2 mb-1 border-b border-white/10"
                    ref={userMenuRef}
                  >
                    <UserCircle size={18} className="text-white/70 shrink-0" />
                    <span className="text-white text-sm font-semibold truncate">
                      {user.username}
                    </span>
                    <span className="ml-auto px-1.5 py-0.5 rounded bg-secondary text-white text-[10px] font-semibold shrink-0">
                      {labelsMap.roles[firstRole]}
                    </span>
                  </div>
                )}

                {[
                  { label: 'Inicio', section: 'inicio' },
                  { label: 'Motos', section: 'bikes-catalogue' },
                  { label: 'Repuestos', section: 'parts-catalogue' },
                  { label: 'Cobertura', section: 'cobertura' },
                  { label: 'Métodos de Pago', section: 'payment-methods' },
                  { label: 'Contacto', section: 'contacto' },
                ].map(({ label, section }) => (
                  <button
                    key={section}
                    onClick={() => {
                      scrollToSection(section);
                      toggleBar();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-gray-800 text-sm font-medium active:bg-white/10"
                  >
                    {label}
                  </button>
                ))}

                {user && (
                  <div className="border-t border-white/10 mt-1 pt-1">
                    <button
                      className="w-full text-left px-3 py-2.5 rounded-xl text-white text-sm font-medium active:bg-white/10"
                      onClick={goToPanel}
                    >
                      Panel de usuario
                    </button>
                    <button
                      className="w-full text-left px-3 py-2.5 rounded-xl text-red-400 text-sm font-medium active:bg-white/10"
                      onClick={handleLogout}
                    >
                      Salir
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default LandingNavBar;
