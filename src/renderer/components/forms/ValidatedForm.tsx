import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type DefaultValues, type FieldValues, type Resolver, type SubmitHandler } from 'react-hook-form'
import type { ReactNode } from 'react'
import type { z } from 'zod'

export function ValidatedForm<T extends FieldValues>({ schema, defaults, onSubmit, children }: { schema: z.ZodType<T>; defaults: DefaultValues<T>; onSubmit: SubmitHandler<T>; children: (form: ReturnType<typeof useForm<T>>) => ReactNode }) {
  const form = useForm<T>({ resolver: zodResolver(schema as never) as Resolver<T>, defaultValues: defaults })
  return <form onSubmit={form.handleSubmit(onSubmit)}>{children(form)}</form>
}
