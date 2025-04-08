
import { FC, ReactElement } from 'react';

import styles from './spinner.module.scss';

interface ISpinner {
  className?: string;
}

const Spinner: FC<ISpinner> = ({ className }): ReactElement => (
  <div className={cn(className, styles.spinner)}></div>
);

export { Spinner };
  function cn(_className: string | undefined, _spinner: any): string | undefined {
    throw new Error('Function not implemented.');
  }

