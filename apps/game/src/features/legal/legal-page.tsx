import type React from 'react'
import { useId } from 'react'

import { homePathFor } from '@/infrastructure/router/navigation'
import { ANALYTICS_OPT_OUT_KEY } from '@/infrastructure/storage/analytics-opt-out-storage'
import {
  HOST_SETUP_KEY,
  LOCALE_KEY,
  NICKNAME_KEY,
  PANEL_FOLDED_KEY,
  PANEL_SIDE_KEY,
  VOLUME_KEY
} from '@/infrastructure/storage/preferences-storage'
import { PREPARED_KEYS_KEY } from '@/infrastructure/storage/prepared-keys-storage'
import {
  HOST_TOKENS_KEY,
  SEATS_KEY
} from '@/infrastructure/storage/session-storage'
import { Link } from '@/presentation/components/link'
import { Main } from '@/presentation/components/main'
import { TextLink } from '@/presentation/components/text-link'
import { PAGE_HEADS } from '@/presentation/head/document-head'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'
import { RichText } from '@/presentation/i18n/rich-text'
import type { PlainTranslationKey } from '@/presentation/i18n/translation'
import { THEME_STORAGE_KEY } from '@/presentation/theme/theme-store'

import {
  CNIL_COMPLAINT_HREF,
  DEEZER_PRIVACY_HREF,
  HOST,
  MEASUREMENT_RETENTION_MONTHS,
  PUBLISHER
} from './legal-details'
import { MeasurementSwitch } from './measurement-switch'

import './legal-page.sass'

type StoredKey = {
  key: string
  what: PlainTranslationKey
}

/** Every key this site writes to the browser's `localStorage`, in the order a visitor meets them. */
const LOCAL_KEYS: StoredKey[] = [
  { key: THEME_STORAGE_KEY, what: 'legal.storage.theme' },
  { key: LOCALE_KEY, what: 'legal.storage.locale' },
  { key: NICKNAME_KEY, what: 'legal.storage.nickname' },
  { key: SEATS_KEY, what: 'legal.storage.seats' },
  { key: HOST_TOKENS_KEY, what: 'legal.storage.hostTokens' },
  { key: HOST_SETUP_KEY, what: 'legal.storage.hostSetup' },
  { key: VOLUME_KEY, what: 'legal.storage.volume' },
  { key: PANEL_FOLDED_KEY, what: 'legal.storage.panelFolded' },
  { key: PANEL_SIDE_KEY, what: 'legal.storage.panelSide' },
  { key: ANALYTICS_OPT_OUT_KEY, what: 'legal.storage.analyticsOptOut' }
]

/** The one key kept in `sessionStorage`, which the tab drops when it closes. */
const SESSION_KEYS: StoredKey[] = [
  { key: PREPARED_KEYS_KEY, what: 'legal.storage.slateKeys' }
]

type LegalSectionProps = {
  children: React.ReactNode
  heading: string
}

/** What a rich message's tag renders: its words, as a link out of the site. */
const linkTo =
  (href: string) =>
  (children: string): React.ReactNode => (
    <TextLink href={href} target='_blank'>
      {children}
    </TextLink>
  )

const LegalSection: React.FC<LegalSectionProps> = ({ children, heading }) => {
  const headingId = useId()

  return (
    <section aria-labelledby={headingId} className='legal-section'>
      <h2 id={headingId}>{heading}</h2>
      {children}
    </section>
  )
}

const StoredKeys: React.FC<{ keys: StoredKey[] }> = ({ keys }) => {
  const translate = useTranslate()

  return (
    <dl className='stored-keys'>
      {keys.map(({ key, what }) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>{translate(what)}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * The French LCEN's legal notice and the privacy policy, on one page the menu
 * links to from every screen. What it says is what the code does: the stored
 * keys are read off the storage modules, so a key renamed there is renamed
 * here.
 */
export const LegalPage: React.FC = () => {
  const { locale } = useI18n()
  const translate = useTranslate()
  const contactLink = linkTo(PUBLISHER.contactHrefFor[locale])

  return (
    <Main className='legal-page'>
      <DocumentTitle>{PAGE_HEADS[locale].legal.title}</DocumentTitle>
      <header>
        <h1>{translate('legal.title')}</h1>
        <p className='intro'>{translate('legal.intro')}</p>
      </header>

      <LegalSection heading={translate('legal.publisher.heading')}>
        <p>
          <RichText
            parts={translate.rich('legal.publisher.body', {
              contact: contactLink,
              name: PUBLISHER.name
            })}
          />
        </p>
        <p>{translate('legal.publisher.address')}</p>
      </LegalSection>

      <LegalSection heading={translate('legal.host.heading')}>
        <p>{translate('legal.host.body')}</p>
        <address>
          {[HOST.name, ...HOST.addressLines].map((line) => (
            <span key={line}>{line}</span>
          ))}
        </address>
      </LegalSection>

      <LegalSection heading={translate('legal.storage.heading')}>
        <p>{translate('legal.storage.device')}</p>
        <StoredKeys keys={LOCAL_KEYS} />
        <p>{translate('legal.storage.session')}</p>
        <StoredKeys keys={SESSION_KEYS} />
        <p>{translate('legal.storage.server')}</p>
        <p>{translate('legal.storage.logs')}</p>
      </LegalSection>

      <LegalSection heading={translate('legal.thirdParties.heading')}>
        <p>{translate('legal.thirdParties.cloudflare')}</p>
        <p>
          <RichText
            parts={translate.rich('legal.thirdParties.deezer', {
              policy: linkTo(DEEZER_PRIVACY_HREF)
            })}
          />
        </p>
        <p>{translate('legal.thirdParties.nobodyElse')}</p>
      </LegalSection>

      <LegalSection heading={translate('legal.measurement.heading')}>
        <p>{translate('legal.measurement.body')}</p>
        <p>
          {translate('legal.measurement.retention', {
            months: MEASUREMENT_RETENTION_MONTHS
          })}
        </p>
        <p>{translate('legal.measurement.exemption')}</p>
        <MeasurementSwitch />
      </LegalSection>

      <LegalSection heading={translate('legal.rights.heading')}>
        <p>
          <RichText
            parts={translate.rich('legal.rights.body', {
              contact: contactLink
            })}
          />
        </p>
        <p>
          <RichText
            parts={translate.rich('legal.rights.complaint', {
              authority: linkTo(CNIL_COMPLAINT_HREF)
            })}
          />
        </p>
      </LegalSection>

      <Link href={homePathFor(locale)} variant='outlined'>
        {translate('navigation.back')}
      </Link>
    </Main>
  )
}
