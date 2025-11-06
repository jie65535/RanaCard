declare namespace Types {

    namespace Core {

        type OptionItem<T = any> = {
            label: string;
            value: T;
            type?: 'primary' | 'success' | 'info' | 'warning' | 'danger';
            bgColor?: string;
            textColor?: string;
        }
        
    }

}