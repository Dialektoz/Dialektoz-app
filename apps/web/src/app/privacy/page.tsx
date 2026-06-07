import Link from 'next/link'
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react'
import LandingHeader from '@/components/landing/LandingHeader'

export const metadata = {
  title: 'Política de Privacidad | Dialektoz',
  description:
    'Política de Tratamiento de Datos Personales y Privacidad de Dialektoz. Conoce cómo recolectamos, usamos y protegemos tu información.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full min-h-[100dvh] bg-background text-foreground flex flex-col font-sans relative overflow-x-hidden">
      {/* Background ambient light — consistent with landing */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 rounded-full blur-[150px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-[10%] w-[30%] h-[40%] bg-accent/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      <LandingHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 lg:px-12 py-12 lg:py-20 z-10">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-foreground/60 hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Volver al inicio
        </Link>

        {/* Hero */}
        <section className="space-y-6 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary font-bold px-4 py-1.5 rounded-full text-sm">
            <ShieldCheck size={16} />
            Privacidad y Datos Personales
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Política de{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Privacidad
            </span>
          </h1>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm text-foreground/60">
            <span>
              <span className="font-bold text-foreground/80">Última actualización:</span> 24 de Mayo, 2026
            </span>
            <span className="hidden sm:inline text-foreground/30">•</span>
            <span>
              <span className="font-bold text-foreground/80">Responsable:</span> Dialektoz S.A.S.
            </span>
            <span className="hidden sm:inline text-foreground/30">•</span>
            <a
              href="mailto:info@dialektoz.com"
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              <Mail size={14} />
              info@dialektoz.com
            </a>
          </div>
        </section>

        {/* Content */}
        <article className="bg-card/60 border border-border/40 rounded-3xl p-7 sm:p-10 lg:p-14 shadow-2xl">
            <p className="text-base text-foreground/80 leading-relaxed mb-10">
              En Dialektoz nos comprometemos a proteger la privacidad y seguridad de los datos personales
              de todos nuestros usuarios. Esta Política describe cómo recolectamos, usamos, almacenamos
              y protegemos tu información cuando utilizas nuestra plataforma educativa, y los derechos
              que tienes como titular de tus datos.
            </p>

            <Section id="marco-legal" title="1. Marco Legal y Cumplimiento">
              <p>
                Dialektoz se compromete con la protección de la privacidad y la seguridad de los datos
                personales de sus usuarios. Esta Política se rige bajo los más altos estándares
                internacionales y locales, cumpliendo específicamente con:
              </p>
              <ul>
                <li>
                  <strong>En Colombia:</strong> Ley 1581 de 2012 (Habeas Data) y decretos reglamentarios.
                </li>
                <li>
                  <strong>En Estados Unidos:</strong> Leyes de privacidad estatales (estándar CCPA/CPRA
                  de California) y normativas federales aplicables al comercio electrónico.
                </li>
              </ul>
            </Section>

            <Section id="restriccion-edad" title="2. Restricción de Edad (Elegibilidad)">
              <p>
                La plataforma Dialektoz está diseñada y dirigida exclusivamente a personas mayores de
                dieciocho (18) años. No recopilamos, solicitamos ni procesamos a sabiendas datos de
                menores de edad. Si se identifica que un usuario menor de 18 años ha creado una cuenta,
                esta será suspendida e identificada para su eliminación inmediata.
              </p>
            </Section>

            <Section id="datos-recolectados" title="3. Datos que Recolectamos y Finalidad">
              <p>
                A través del registro directo, Google Auth o Facebook Login, Dialektoz recolecta:
                <strong> nombre, dirección de correo electrónico y fecha de nacimiento.</strong>
              </p>
              <p>
                <strong>Finalidad:</strong> proveer el servicio educativo, gestionar el acceso a los
                módulos según el rol (Admin, Teacher, Student Premium, Premium, Free), monitorear el
                progreso académico (para estudiantes de la academia) y enviar comunicaciones de
                servicio o soporte.
              </p>
            </Section>

            <Section id="pasarelas-pago" title="4. Pasarelas de Pago y Seguridad Financiera (Stripe y Wompi)">
              <p>
                El procesamiento de pagos y suscripciones recurrentes se realiza de manera externa y
                segura a través de <strong>Stripe</strong> (para transacciones internacionales) y{' '}
                <strong>Wompi</strong> (para transacciones en Colombia).
              </p>
              <p>
                Dialektoz <strong>no almacena, procesa ni tiene acceso</strong> a datos sensibles de
                tarjetas de crédito, cuentas bancarias ni códigos de seguridad (CVV).
              </p>
              <p>
                La recolección de estos datos financieros se realiza bajo la tecnología de tokenización
                de dichas pasarelas, eximiendo a la base de datos interna de Dialektoz del
                almacenamiento de información financiera crítica conforme a la normativa PCI-DSS.
              </p>
            </Section>

            <Section id="transferencia-internacional" title="5. Transferencia Internacional de Datos">
              <p>
                Al registrarse, el usuario acepta de manera expresa que sus datos personales sean
                alojados y procesados en servidores de infraestructura en la nube (como Supabase/AWS)
                localizados en los Estados Unidos, los cuales cuentan con rigurosos niveles de
                certificación y seguridad informática.
              </p>
            </Section>

            <Section id="derechos-arco" title="6. Derechos del Usuario (ARCO)">
              <p>
                Cualquier usuario puede ejercer sus derechos a conocer, actualizar, rectificar o
                solicitar la eliminación total de sus datos personales enviando una solicitud formal a{' '}
                <a href="mailto:info@dialektoz.com" className="text-primary hover:underline">
                  info@dialektoz.com
                </a>
                .
              </p>
              <p>
                El titular o su representante legal podrán ejercer en cualquier momento los derechos
                de:
              </p>
              <ul>
                <li>
                  <strong>Acceso:</strong> conocer qué datos personales tenemos sobre ti.
                </li>
                <li>
                  <strong>Rectificación:</strong> solicitar corrección de datos inexactos o
                  incompletos.
                </li>
                <li>
                  <strong>Cancelación / Supresión:</strong> solicitar la eliminación de tus datos
                  cuando ya no sean necesarios para la finalidad de tratamiento.
                </li>
                <li>
                  <strong>Oposición:</strong> oponerte al tratamiento de tus datos para fines
                  específicos.
                </li>
                <li>
                  <strong>Revocación del consentimiento:</strong> retirar el consentimiento otorgado
                  previamente para el tratamiento.
                </li>
              </ul>
              <p>
                Daremos respuesta a tu solicitud dentro de los plazos legales aplicables a tu
                jurisdicción.
              </p>
            </Section>

            <Section id="conservacion" title="7. Conservación de Datos">
              <p>
                Conservaremos tus datos personales únicamente durante el tiempo necesario para cumplir
                con las finalidades para las cuales fueron recolectados, incluyendo el cumplimiento de
                obligaciones legales, contables o de reporte. Una vez finalizada esta necesidad, los
                datos serán eliminados de forma segura o anonimizados para fines estadísticos.
              </p>
            </Section>

            <Section id="cookies" title="8. Cookies y Tecnologías Similares">
              <p>
                Dialektoz utiliza cookies y tecnologías similares estrictamente necesarias para el
                funcionamiento de la plataforma — principalmente para mantener la sesión iniciada,
                recordar preferencias del usuario y garantizar la seguridad de las cuentas.
              </p>
              <p>
                Puedes configurar tu navegador para que rechace cookies; sin embargo, hacerlo puede
                impactar el funcionamiento correcto de algunas funcionalidades de la plataforma (por
                ejemplo, mantener la sesión activa).
              </p>
            </Section>

            <Section id="seguridad" title="9. Seguridad de la Información">
              <p>
                Implementamos medidas técnicas, administrativas y físicas razonables para proteger tus
                datos personales contra pérdida, acceso no autorizado, alteración o divulgación,
                incluyendo:
              </p>
              <ul>
                <li>Conexiones cifradas mediante HTTPS / TLS en todas las comunicaciones.</li>
                <li>Almacenamiento de contraseñas mediante algoritmos de hashing seguros.</li>
                <li>Autenticación segura a través de proveedores como Google y Facebook (OAuth).</li>
                <li>Controles de acceso por rol (RBAC) sobre los recursos de la plataforma.</li>
                <li>Tokenización de datos financieros a cargo de Stripe y Wompi.</li>
              </ul>
              <p>
                Ningún sistema es infalible; si detectas o sospechas un uso indebido de tu cuenta,
                notifícanos de inmediato a{' '}
                <a href="mailto:info@dialektoz.com" className="text-primary hover:underline">
                  info@dialektoz.com
                </a>
                .
              </p>
            </Section>

            <Section id="terceros" title="10. Servicios de Terceros">
              <p>
                Para operar la plataforma utilizamos proveedores de tecnología confiables que pueden
                procesar datos personales en nuestro nombre y bajo nuestras instrucciones, entre ellos:
              </p>
              <ul>
                <li>
                  <strong>Supabase / AWS:</strong> infraestructura de bases de datos y autenticación.
                </li>
                <li>
                  <strong>Google y Facebook:</strong> autenticación social (OAuth).
                </li>
                <li>
                  <strong>Stripe y Wompi:</strong> procesamiento de pagos.
                </li>
                <li>
                  <strong>Zoho Mail:</strong> envío de comunicaciones transaccionales.
                </li>
              </ul>
              <p>
                Cada uno de estos proveedores se rige por sus propias políticas de privacidad y
                estándares de seguridad reconocidos a nivel internacional.
              </p>
            </Section>

            <Section id="cambios" title="11. Cambios a esta Política">
              <p>
                Podemos actualizar esta Política periódicamente para reflejar cambios en nuestras
                prácticas, en la normativa aplicable o en los servicios ofrecidos. La fecha de la
                última actualización se mostrará al inicio de este documento. Cuando los cambios sean
                materiales, te notificaremos por los medios habituales (correo electrónico o aviso
                dentro de la plataforma).
              </p>
            </Section>

            <Section id="contacto" title="12. Contacto y Atención al Titular">
              <p>
                Si tienes preguntas, comentarios o deseas ejercer cualquiera de tus derechos sobre el
                tratamiento de tus datos personales, puedes contactarnos a través de:
              </p>
              <ul>
                <li>
                  <strong>Correo electrónico:</strong>{' '}
                  <a href="mailto:info@dialektoz.com" className="text-primary hover:underline">
                    info@dialektoz.com
                  </a>
                </li>
                <li>
                  <strong>Responsable del tratamiento:</strong> Dialektoz S.A.S.
                </li>
              </ul>
              <p>
                Atenderemos tu solicitud dentro de los plazos establecidos por la legislación
                aplicable.
              </p>
            </Section>

            {/* Footer CTA */}
            <div className="mt-12 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-sm text-foreground/60">
                ¿Tienes dudas adicionales sobre el tratamiento de tus datos?
              </p>
              <a
                href="mailto:info@dialektoz.com"
                className="inline-flex items-center gap-2 bg-primary hover:bg-secondary text-black font-extrabold py-2.5 px-5 rounded-full text-sm transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                <Mail size={16} />
                Contactar a Dialektoz
            </a>
          </div>
        </article>
      </main>

      {/* Footer strip */}
      <footer className="border-t border-border/40 bg-background/50 backdrop-blur-xl z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-foreground/50">
          <p>© {new Date().getFullYear()} Dialektoz S.A.S. Todos los derechos reservados.</p>
          <div className="flex items-center gap-5">
            <Link href="/" className="hover:text-primary transition-colors">
              Inicio
            </Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacidad
            </Link>
            <Link href="/login" className="hover:text-primary transition-colors">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-28 mb-10 last:mb-0">
      <h2 className="text-2xl sm:text-[1.65rem] font-extrabold tracking-tight text-foreground mb-4">
        {title}
      </h2>
      <div className="prose prose-invert max-w-none prose-p:text-foreground/75 prose-p:leading-relaxed prose-li:text-foreground/75 prose-li:leading-relaxed prose-strong:text-foreground prose-strong:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
        {children}
      </div>
    </section>
  )
}
