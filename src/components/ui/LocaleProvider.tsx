"use client";
import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
export function LocaleProvider({
  children,
  messages,
}: {
  children: React.ReactNode;
  messages: AbstractIntlMessages;
}) {
  return (
    <NextIntlClientProvider
      locale="en"
      timeZone="Asia/Kolkata"
      messages={messages}
    >
      {children}
    </NextIntlClientProvider>
  );
}
