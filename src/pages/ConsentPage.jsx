import PageHero from '../components/PageHero.jsx'
import { siteConfig } from '../siteConfig.js'

export default function ConsentPage() {
  const { personalData } = siteConfig

  return (
    <>
      <PageHero
        eyebrow="Документы"
        title="Согласие на обработку персональных данных"
        description="Условия обработки данных, передаваемых через форму заявки на сайте ТРИБЕКА"
      />

      <section className="bg-[#f7f7f5] py-20 sm:py-24">
        <div className="container-page max-w-4xl">
          <div className="grid gap-6 border border-ink/10 bg-white p-7 text-sm leading-7 text-ink/65 sm:p-10">
            <p>Устанавливая отметку в форме и нажимая кнопку «Обсудить проект», пользователь свободно, своей волей и в своём интересе даёт {siteConfig.legalName}, находящемуся по адресу {siteConfig.address}, согласие на обработку персональных данных на следующих условиях.</p>

            <section>
              <h2 className="font-black uppercase text-ink">1. Перечень данных</h2>
              <p className="mt-2">Имя, номер телефона, текст обращения, содержимое и метаданные приложенных файлов, адрес страницы и источник отправки, IP-адрес, сведения о браузере, дата и время отправки, идентификатор заявки и версия документов, с которыми ознакомился пользователь.</p>
            </section>

            <section>
              <h2 className="font-black uppercase text-ink">2. Цель</h2>
              <p className="mt-2">Рассмотрение обращения, уточнение требований, подготовка расчёта стоимости и сроков, ответ пользователю и взаимодействие по инициированному им проекту. Согласие не распространяется на рекламные рассылки.</p>
            </section>

            <section>
              <h2 className="font-black uppercase text-ink">3. Действия с данными</h2>
              <p className="mt-2">Сбор, запись, систематизация, накопление, хранение, уточнение, извлечение, использование, предоставление техническим обработчикам, блокирование, удаление и уничтожение с применением автоматизированных средств и без них.</p>
            </section>

            <section>
              <h2 className="font-black uppercase text-ink">4. Срок</h2>
              <p className="mt-2">Согласие действует до достижения цели обработки, его отзыва либо не более {personalData.leadRetentionDays} дней со дня отправки заявки, если продолжение обработки не требуется по закону или заключённому договору.</p>
            </section>

            <section>
              <h2 className="font-black uppercase text-ink">5. Технические обработчики</h2>
              <p className="mt-2">Для размещения и доставки заявки могут использоваться российский хостинг и сервис электронной почты. Они получают доступ только в объёме, необходимом для оказания технической услуги.</p>
            </section>

            <section>
              <h2 className="font-black uppercase text-ink">6. Отзыв согласия</h2>
              <p className="mt-2">Согласие можно отозвать, направив письмо на <a className="text-signal underline underline-offset-2" href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>. В обращении необходимо указать сведения, позволяющие идентифицировать заявку. Отзыв не влияет на законность обработки, выполненной до его получения.</p>
            </section>
          </div>

          <p className="mt-8 text-xs text-ink/40">Версия Согласия: {personalData.consentVersion}</p>
        </div>
      </section>
    </>
  )
}
