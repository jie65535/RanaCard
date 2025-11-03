declare namespace Types.Editor {

    namespace EffectString {

        interface DictFunc extends Types.Core.OptionItem<string> {
            args?: {
                name: string;
                placeholder?: string
            }[];
            group?: string;
        }

        interface Condition {
            target?: string
            attr?: string
            op?: string
            value?: string
        }

        interface AttrAction {
            type: 'attr';
            target: string;
            attr: string;
            mode: 'add'|'set';
            value: string;
            _id?: string;
        }

        interface FuncArg {
            label?: string;
            placeholder?: string;
            value: string;
        }
        interface FuncAction {
            type: 'func';
            name: string;
            args: FuncArg[];
            _id?: string;
            __rawArgs?: string;
        }
        type AnyAction = AttrAction | FuncAction;

        interface Segment {
            _id?: string,
            cond: Condition,
            actions: AnyAction[]
        }

        interface Sentence {
            trigger: string,
            triggerArgs?: string,
            segments: Segment[],
            consume?: boolean,
            foresee?: boolean,
            _id?: string
        }

    }

}