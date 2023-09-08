import React from "react"
import { useThemeConfig } from "@docusaurus/theme-common"
import { useAnnouncementBar } from "@docusaurus/theme-common/internal"
import AnnouncementBarCloseButton from "@theme/AnnouncementBar/CloseButton"
import AnnouncementBarContent from "@theme/AnnouncementBar/Content"

import Bordered from "@site/src/components/Bordered"
import IconBell from "@site/src/theme/Icon/Bell/index"
import clsx from "clsx"

export default function AnnouncementBar(): JSX.Element | null {
  const { announcementBar } = useThemeConfig()
  const { isActive, close } = useAnnouncementBar()
  if (!isActive) {
    return null
  }
  const { isCloseable, id } = announcementBar!
  return (
    <div
      className={clsx(
        "relative flex items-center h-auto bg-medusa-bg-subtle dark:bg-medusa-bg-base-dark p-0.75",
        "rounded mx-1.5 mb-1 shadow-card-rest dark:shadow-card-rest-dark",
        "transition-all duration-200 ease-ease",
        "hover:bg-medusa-bg-subtle-hover dark:hover:bg-medusa-bg-base-hover-dark",
        "print:hidden"
      )}
    >
      <Bordered wrapperClassName="mr-0.75">
        <div
          className={clsx(
            "p-[6px] flex justify-center items-center",
            "rounded-xs bg-medusa-bg-component dark:bg-medusa-bg-component-dark"
          )}
        >
          <IconBell iconColorClassName="fill-medusa-fg-subtle dark:fill-medusa-fg-subtle-dark" />
        </div>
      </Bordered>
      <AnnouncementBarContent className={clsx("flex-1")} />
      {isCloseable && (
        <AnnouncementBarCloseButton
          onClick={close}
          className={clsx("z-[101] text-right lg:basis-[50px]")}
        />
      )}
      <a
        href={id}
        className={clsx("absolute top-0 left-0 w-full h-full z-[100]")}
      />
    </div>
  )
}