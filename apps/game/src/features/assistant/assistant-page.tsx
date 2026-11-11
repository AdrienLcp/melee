import type React from 'react'
import { Fragment } from 'react'

import { homePathFor, useMcpUrl } from '@/infrastructure/router/navigation'
import { CopyButton } from '@/presentation/components/copy-button'
import { Link } from '@/presentation/components/link'
import { Main } from '@/presentation/components/main'
import { PAGE_HEADS } from '@/presentation/head/document-head'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'
import type { PlainTranslationKey } from '@/presentation/i18n/translation'

import './assistant-page.sass'

type CopyableLineProps = {
  /** Names what the button beside the line copies. */
  copyLabel: PlainTranslationKey
  /** `code` for what is pasted as is — an address, a command — and `prose` for a sentence said to the assistant, set between the locale's quotes. */
  kind: 'code' | 'prose'
  /** What is shown, and what lands in the clipboard without the quotes. */
  value: string
}

const WORD = /\S+/g

/**
 * A line broken at its spaces alone: left to itself, the browser breaks
 * `--transport` after its hyphens, and a reader copying it by eye types a
 * flag that no longer exists.
 */
const VerbatimWords: React.FC<{ value: string }> = ({ value }) =>
  [...value.matchAll(WORD)].map((word) => (
    <Fragment key={word.index}>
      {word.index > 0 && ' '}
      <span className='word'>{word[0]}</span>
    </Fragment>
  ))

const CopyableLine: React.FC<CopyableLineProps> = ({
  copyLabel,
  kind,
  value
}) => (
  <div className='copyable-line' data-kind={kind}>
    <p className='value'>
      {kind === 'prose' ? <q>{value}</q> : <VerbatimWords value={value} />}
    </p>
    <CopyButton label={copyLabel} value={value} />
  </div>
)

/**
 * How a host hands `/mcp` to an AI assistant, which composes a line-up and
 * answers with the link `features/evening-link/` opens. The page stores
 * nothing; what the assistant's provider sends `/mcp` is on the legal page.
 */
export const AssistantPage: React.FC = () => {
  const { locale } = useI18n()
  const translate = useTranslate()
  const mcpUrl = useMcpUrl()

  return (
    <Main className='assistant-page'>
      <DocumentTitle>{PAGE_HEADS[locale].assistant.title}</DocumentTitle>
      <header>
        <h1>{translate('assistant.title')}</h1>
        <p className='intro'>{translate('assistant.intro')}</p>
      </header>

      <ol className='steps'>
        <li>
          <h2>{translate('assistant.address.heading')}</h2>
          <p className='note'>{translate('assistant.address.note')}</p>
          <CopyableLine
            copyLabel='assistant.address.copy'
            kind='code'
            value={mcpUrl}
          />
        </li>

        <li>
          <h2>{translate('assistant.connect.heading')}</h2>
          <dl className='clients'>
            <div>
              <dt>{translate('assistant.connect.claude.name')}</dt>
              <dd>{translate('assistant.connect.claude.steps')}</dd>
            </div>
            <div>
              <dt>{translate('assistant.connect.claudeCode.name')}</dt>
              <dd>
                <CopyableLine
                  copyLabel='assistant.connect.claudeCode.copy'
                  kind='code'
                  value={translate('assistant.connect.claudeCode.command', {
                    url: mcpUrl
                  })}
                />
              </dd>
            </div>
            <div>
              <dt>{translate('assistant.connect.other.name')}</dt>
              <dd>{translate('assistant.connect.other.steps')}</dd>
            </div>
          </dl>
        </li>

        <li>
          <h2>{translate('assistant.ask.heading')}</h2>
          <p className='note'>{translate('assistant.ask.note')}</p>
          <CopyableLine
            copyLabel='assistant.ask.copy'
            kind='prose'
            value={translate('assistant.ask.example')}
          />
          <CopyableLine
            copyLabel='assistant.ask.ownQuiz.copy'
            kind='prose'
            value={translate('assistant.ask.ownQuiz.example')}
          />
          <p className='note'>{translate('assistant.ask.ownQuiz.note')}</p>
        </li>
      </ol>

      <p className='outcome'>{translate('assistant.outcome')}</p>

      <Link href={homePathFor(locale)} variant='outlined'>
        {translate('navigation.back')}
      </Link>
    </Main>
  )
}
