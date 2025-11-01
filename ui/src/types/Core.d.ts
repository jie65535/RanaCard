declare namespace Types {

    namespace Core {

        type OptionItem<T> = {
            label: string;
            value: any;
            type?: 'primary' | 'success' | 'info' | 'warning' | 'danger';
            bgColor?: string;
            textColor?: string;
        }
        
    }

}